import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Goal {
  id: string;
  provider_id: string;
  barbershop_id: string;
  goal_type: string;
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
  // Joined data
  provider_name?: string;
  service_name?: string;
  product_name?: string;
}

export interface CreateGoalData {
  provider_id: string;
  goal_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  specific_service_id?: string;
  specific_product_id?: string;
}

export const useGoalsManagement = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchGoals = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('provider_goals')
        .select(`
          *,
          provider:profiles!provider_goals_provider_id_fkey(full_name),
          service:services!provider_goals_specific_service_id_fkey(name),
          product:products!provider_goals_specific_product_id_fkey(name)
        `)
        .eq('barbershop_id', profile.barbershop_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedGoals = data?.map(goal => ({
        ...goal,
        provider_name: goal.provider?.full_name || 'N/A',
        service_name: goal.service?.name || null,
        product_name: goal.product?.name || null,
      })) || [];

      setGoals(formattedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Erro ao carregar metas",
        description: "Não foi possível carregar as metas dos prestadores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: CreateGoalData) => {
    if (!profile?.barbershop_id) return false;

    try {
      const { error } = await supabase
        .from('provider_goals')
        .insert({
          ...goalData,
          barbershop_id: profile.barbershop_id,
          created_by: profile.id,
          current_value: 0,
        });

      if (error) throw error;

      toast({
        title: "Meta criada com sucesso",
        description: "A nova meta foi criada para o prestador.",
      });

      fetchGoals();
      return true;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Erro ao criar meta",
        description: "Não foi possível criar a meta. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const { error } = await supabase
        .from('provider_goals')
        .update(updates)
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: "Meta atualizada",
        description: "A meta foi atualizada com sucesso.",
      });

      fetchGoals();
      return true;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Erro ao atualizar meta",
        description: "Não foi possível atualizar a meta. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('provider_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: "Meta excluída",
        description: "A meta foi excluída com sucesso.",
      });

      fetchGoals();
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Erro ao excluir meta",
        description: "Não foi possível excluir a meta. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleGoalStatus = async (goalId: string, isActive: boolean) => {
    return updateGoal(goalId, { is_active: isActive });
  };

  useEffect(() => {
    fetchGoals();
  }, [profile?.barbershop_id]);

  return {
    goals,
    loading,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleGoalStatus,
  };
};