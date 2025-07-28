import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ProviderGoal {
  id: string;
  provider_id: string;
  barbershop_id: string;
  goal_type: 'service_quantity' | 'service_value' | 'product_quantity' | 'product_value' | 'specific_product' | 'specific_service';
  target_value: number;
  current_value: number;
  period_start: string;
  period_end: string;
  specific_service_id?: string;
  specific_product_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  provider?: {
    full_name: string;
    email: string;
  };
  specific_service?: {
    name: string;
  };
  specific_product?: {
    name: string;
  };
}

export const useProviderGoals = (providerId?: string) => {
  const [goals, setGoals] = useState<ProviderGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchGoals = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('provider_goals')
        .select(`
          *,
          provider:profiles!provider_id(full_name, email),
          specific_service:services(name),
          specific_product:products(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Se um providerId específico foi fornecido, filtrar por ele
      if (providerId) {
        query = query.eq('provider_id', providerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching provider goals:', error);
        return;
      }

      setGoals((data as ProviderGoal[]) || []);
    } catch (error) {
      console.error('Error in fetchGoals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchGoals();
    }
  }, [profile?.barbershop_id, providerId]);

  const createGoal = async (goalData: Omit<ProviderGoal, 'id' | 'created_at' | 'updated_at' | 'current_value'>) => {
    try {
      if (!profile?.barbershop_id) {
        throw new Error('Barbearia não identificada');
      }

      const { data, error } = await supabase
        .from('provider_goals')
        .insert({
          ...goalData,
          barbershop_id: profile.barbershop_id,
          created_by: profile.id,
          current_value: 0
        })
        .select(`
          *,
          provider:profiles!provider_id(full_name, email),
          specific_service:services(name),
          specific_product:products(name)
        `)
        .single();

      if (error) throw error;

      setGoals(prev => [data as ProviderGoal, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating goal:', error);
      return { data: null, error };
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<ProviderGoal>) => {
    try {
      const { data, error } = await supabase
        .from('provider_goals')
        .update(updates)
        .eq('id', goalId)
        .select(`
          *,
          provider:profiles!provider_id(full_name, email),
          specific_service:services(name),
          specific_product:products(name)
        `)
        .single();

      if (error) throw error;

      setGoals(prev => prev.map(goal => goal.id === goalId ? data as ProviderGoal : goal));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating goal:', error);
      return { data: null, error };
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('provider_goals')
        .update({ is_active: false })
        .eq('id', goalId);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      return { error };
    }
  };

  const updateGoalProgress = async () => {
    // Esta função será chamada periodicamente para atualizar o progresso das metas
    // baseado nos dados reais de vendas/serviços
    try {
      const activePeriodGoals = goals.filter(goal => {
        const now = new Date();
        const periodStart = new Date(goal.period_start);
        const periodEnd = new Date(goal.period_end);
        return now >= periodStart && now <= periodEnd;
      });

      for (const goal of activePeriodGoals) {
        let currentValue = 0;

        switch (goal.goal_type) {
          case 'service_quantity':
            // Contar quantidade de serviços no período
            // Primeiro buscar os command_ids
            const { data: serviceCommands } = await supabase
              .from('commands')
              .select('id')
              .eq('barber_id', goal.provider_id);
            
            if (serviceCommands && serviceCommands.length > 0) {
              const commandIds = serviceCommands.map(c => c.id);
              const { data: serviceItems } = await supabase
                .from('command_items')
                .select('quantity')
                .eq('item_type', 'service')
                .gte('created_at', goal.period_start)
                .lte('created_at', goal.period_end)
                .in('command_id', commandIds);
              currentValue = serviceItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            }
            break;

          case 'service_value':
            // Somar valor dos serviços no período
            const { data: serviceValueCommands } = await supabase
              .from('commands')
              .select('id')
              .eq('barber_id', goal.provider_id);
            
            if (serviceValueCommands && serviceValueCommands.length > 0) {
              const commandIds = serviceValueCommands.map(c => c.id);
              const { data: serviceValues } = await supabase
                .from('command_items')
                .select('total_price')
                .eq('item_type', 'service')
                .gte('created_at', goal.period_start)
                .lte('created_at', goal.period_end)
                .in('command_id', commandIds);
              currentValue = serviceValues?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;
            }
            break;

          case 'product_quantity':
            // Contar quantidade de produtos no período
            const { data: productCommands } = await supabase
              .from('commands')
              .select('id')
              .eq('barber_id', goal.provider_id);
            
            if (productCommands && productCommands.length > 0) {
              const commandIds = productCommands.map(c => c.id);
              const { data: productItems } = await supabase
                .from('command_items')
                .select('quantity')
                .eq('item_type', 'product')
                .gte('created_at', goal.period_start)
                .lte('created_at', goal.period_end)
                .in('command_id', commandIds);
              currentValue = productItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            }
            break;

          case 'product_value':
            // Somar valor dos produtos no período
            const { data: productValueCommands } = await supabase
              .from('commands')
              .select('id')
              .eq('barber_id', goal.provider_id);
            
            if (productValueCommands && productValueCommands.length > 0) {
              const commandIds = productValueCommands.map(c => c.id);
              const { data: productValues } = await supabase
                .from('command_items')
                .select('total_price')
                .eq('item_type', 'product')
                .gte('created_at', goal.period_start)
                .lte('created_at', goal.period_end)
                .in('command_id', commandIds);
              currentValue = productValues?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;
            }
            break;

          case 'specific_service':
            if (goal.specific_service_id) {
              const { data: specificServiceCommands } = await supabase
                .from('commands')
                .select('id')
                .eq('barber_id', goal.provider_id);
              
              if (specificServiceCommands && specificServiceCommands.length > 0) {
                const commandIds = specificServiceCommands.map(c => c.id);
                const { data: specificServiceItems } = await supabase
                  .from('command_items')
                  .select('quantity')
                  .eq('item_type', 'service')
                  .eq('service_id', goal.specific_service_id)
                  .gte('created_at', goal.period_start)
                  .lte('created_at', goal.period_end)
                  .in('command_id', commandIds);
                currentValue = specificServiceItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              }
            }
            break;

          case 'specific_product':
            if (goal.specific_product_id) {
              const { data: specificProductCommands } = await supabase
                .from('commands')
                .select('id')
                .eq('barber_id', goal.provider_id);
              
              if (specificProductCommands && specificProductCommands.length > 0) {
                const commandIds = specificProductCommands.map(c => c.id);
                const { data: specificProductItems } = await supabase
                  .from('command_items')
                  .select('quantity')
                  .eq('item_type', 'product')
                  .eq('product_id', goal.specific_product_id)
                  .gte('created_at', goal.period_start)
                  .lte('created_at', goal.period_end)
                  .in('command_id', commandIds);
                currentValue = specificProductItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              }
            }
            break;
        }

        // Atualizar o progresso da meta
        if (currentValue !== goal.current_value) {
          await updateGoal(goal.id, { current_value: currentValue });
        }
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress
  };
};