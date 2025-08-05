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

      // Primeira query: buscar registros financeiros
      let financialQuery = supabase
        .from('subscription_financial_records')
        .select('*')
        .order('due_date', { ascending: false });

      // Aplicar filtros nos registros financeiros
      if (filters?.status && filters.status !== 'all') {
        financialQuery = financialQuery.eq('status', filters.status);
      }

      if (filters?.startDate) {
        financialQuery = financialQuery.gte('due_date', filters.startDate);
      }

      if (filters?.endDate) {
        financialQuery = financialQuery.lte('due_date', filters.endDate);
      }

      const { data: financialRecords, error: financialError } = await financialQuery;
      
      if (financialError) throw financialError;
      
      if (!financialRecords || financialRecords.length === 0) {
        setBillings([]);
        return;
      }

      // Segunda query: buscar assinaturas relacionadas
      const subscriptionIds = financialRecords.map(r => r.subscription_id);
      
      let subscriptionsQuery = supabase
        .from('client_subscriptions')
        .select('id, client_id, provider_id, plan_id')
        .eq('barbershop_id', profile.barbershop_id)
        .in('id', subscriptionIds);

      // Aplicar filtro de provider se necessário
      if (filters?.providerId && filters.providerId !== 'all') {
        subscriptionsQuery = subscriptionsQuery.eq('provider_id', filters.providerId);
      }

      const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;
      
      if (subscriptionsError) throw subscriptionsError;

      if (!subscriptions || subscriptions.length === 0) {
        setBillings([]);
        return;
      }

      // Terceira query: buscar clientes
      const clientIds = subscriptions.map(s => s.client_id);
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);
      
      if (clientsError) throw clientsError;

      // Quarta query: buscar providers
      const providerIds = subscriptions.map(s => s.provider_id);
      const { data: providers, error: providersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', providerIds);
      
      if (providersError) throw providersError;

      // Quinta query: buscar planos
      const planIds = subscriptions.map(s => s.plan_id);
      const { data: plans, error: plansError } = await supabase
        .from('provider_subscription_plans')
        .select('id, name')
        .in('id', planIds);
      
      if (plansError) throw plansError;

      // Combinar os dados
      const formattedBillings: SubscriptionBilling[] = financialRecords
        .map((record: any) => {
          const subscription = subscriptions.find(s => s.id === record.subscription_id);
          if (!subscription) return null;

          const client = clients?.find(c => c.id === subscription.client_id);
          const provider = providers?.find(p => p.id === subscription.provider_id);
          const plan = plans?.find(p => p.id === subscription.plan_id);

          return {
            id: record.id,
            subscription_id: record.subscription_id,
            client_name: client?.name || 'Cliente não encontrado',
            provider_name: provider?.full_name || 'Provider não encontrado',
            plan_name: plan?.name || 'Plano não encontrado',
            amount: record.amount,
            commission_amount: record.commission_amount,
            net_amount: record.net_amount,
            due_date: record.due_date,
            status: record.status,
            payment_date: record.payment_date,
            payment_method: record.payment_method,
            notes: record.notes,
            created_at: record.created_at
          };
        })
        .filter(Boolean) as SubscriptionBilling[];

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