import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionBilling {
  id: string;
  subscription_id: string;
  client_name: string;
  provider_name: string;
  plan_name: string;
  amount: number;
  commission_amount: number;
  net_amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_date?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

interface BillingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  providerId?: string;
}

export const useSubscriptionBilling = (filters?: BillingFilters) => {
  const [billings, setBillings] = useState<SubscriptionBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchBillings = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('subscription_financial_records')
        .select(`
          *,
          client_subscriptions!inner(
            id,
            clients!inner(name),
            profiles!inner(full_name),
            provider_subscription_plans!inner(name)
          )
        `)
        .eq('client_subscriptions.barbershop_id', profile.barbershop_id)
        .order('due_date', { ascending: false });

      // Aplicar filtros
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.gte('due_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('due_date', filters.endDate);
      }

      if (filters?.providerId && filters.providerId !== 'all') {
        query = query.eq('client_subscriptions.provider_id', filters.providerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedBillings: SubscriptionBilling[] = (data || []).map((record: any) => ({
        id: record.id,
        subscription_id: record.subscription_id,
        client_name: record.client_subscriptions.clients.name,
        provider_name: record.client_subscriptions.profiles.full_name,
        plan_name: record.client_subscriptions.provider_subscription_plans.name,
        amount: record.amount,
        commission_amount: record.commission_amount,
        net_amount: record.net_amount,
        due_date: record.due_date,
        status: record.status,
        payment_date: record.payment_date,
        payment_method: record.payment_method,
        notes: record.notes,
        created_at: record.created_at
      }));

      setBillings(formattedBillings);
    } catch (error) {
      console.error('Erro ao buscar cobranças:', error);
      setError('Erro ao carregar cobranças');
    } finally {
      setLoading(false);
    }
  };

  const updateBillingStatus = async (
    billingId: string, 
    status: 'paid' | 'pending', 
    paymentMethod?: string,
    notes?: string
  ) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString();
        if (paymentMethod) updateData.payment_method = paymentMethod;
      } else {
        updateData.payment_date = null;
        updateData.payment_method = null;
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('subscription_financial_records')
        .update(updateData)
        .eq('id', billingId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Cobrança ${status === 'paid' ? 'marcada como paga' : 'marcada como pendente'} com sucesso`,
      });

      fetchBillings();
    } catch (error) {
      console.error('Erro ao atualizar cobrança:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da cobrança",
        variant: "destructive",
      });
    }
  };

  const addNotes = async (billingId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('subscription_financial_records')
        .update({ 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', billingId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Observação adicionada com sucesso",
      });

      fetchBillings();
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar observação",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchBillings();
    }
  }, [profile?.barbershop_id, filters]);

  return {
    billings,
    loading,
    error,
    refetch: fetchBillings,
    updateBillingStatus,
    addNotes
  };
};