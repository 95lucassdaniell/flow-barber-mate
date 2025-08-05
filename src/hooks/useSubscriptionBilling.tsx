import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { debugLogger } from "@/lib/debugLogger";

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

  // Memorizar os filtros para evitar recriação
  const memoizedFilters = useMemo(() => filters, [
    filters?.status,
    filters?.startDate,
    filters?.endDate,
    filters?.providerId
  ]);

  const fetchBillings = useCallback(async () => {
    if (!profile?.barbershop_id) {
      debugLogger.subscription.warn('useSubscriptionBilling', 'Sem barbershop_id, abortando fetch');
      return;
    }

    debugLogger.subscription.debug('useSubscriptionBilling', 'barbershop_id', profile.barbershop_id);
    debugLogger.subscription.debug('useSubscriptionBilling', 'filters aplicados', memoizedFilters);

    try {
        setLoading(true);
        setError(null);

        // Primeira query: buscar registros financeiros
        debugLogger.subscription.debug('useSubscriptionBilling', 'Query 1 - Buscando subscription_financial_records');
        let financialQuery = supabase
          .from('subscription_financial_records')
          .select('*')
          .order('due_date', { ascending: false });

        // Aplicar filtros nos registros financeiros
        if (memoizedFilters?.status && memoizedFilters.status !== 'all') {
          financialQuery = financialQuery.eq('status', memoizedFilters.status);
        }

        if (memoizedFilters?.startDate) {
          financialQuery = financialQuery.gte('due_date', memoizedFilters.startDate);
        }

        if (memoizedFilters?.endDate) {
          financialQuery = financialQuery.lte('due_date', memoizedFilters.endDate);
        }

        const { data: financialRecords, error: financialError } = await financialQuery;
        debugLogger.subscription.info('useSubscriptionBilling', `Financial records encontrados: ${financialRecords?.length || 0}`);
        debugLogger.subscription.debug('useSubscriptionBilling', 'Financial records data', financialRecords);
        
        if (financialError) {
          debugLogger.subscription.error('useSubscriptionBilling', 'Erro ao buscar financial_records', financialError);
          throw financialError;
        }
        
        if (!financialRecords || financialRecords.length === 0) {
          debugLogger.subscription.warn('useSubscriptionBilling', 'Nenhum financial_record encontrado');
          setBillings([]);
          return;
        }

        // Segunda query: buscar assinaturas relacionadas
        const subscriptionIds = financialRecords.map(r => r.subscription_id);
        debugLogger.subscription.debug('useSubscriptionBilling', 'Query 2 - Buscando client_subscriptions para IDs', subscriptionIds);
        
        let subscriptionsQuery = supabase
          .from('client_subscriptions')
          .select('id, client_id, provider_id, plan_id')
          .eq('barbershop_id', profile.barbershop_id)
          .in('id', subscriptionIds);

        // Aplicar filtro de provider se necessário
        if (memoizedFilters?.providerId && memoizedFilters.providerId !== 'all') {
          subscriptionsQuery = subscriptionsQuery.eq('provider_id', memoizedFilters.providerId);
        }

        const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;
        debugLogger.subscription.info('useSubscriptionBilling', `Subscriptions encontradas: ${subscriptions?.length || 0}`);
        debugLogger.subscription.debug('useSubscriptionBilling', 'Subscriptions data', subscriptions);
        
        if (subscriptionsError) {
          debugLogger.subscription.error('useSubscriptionBilling', 'Erro ao buscar subscriptions', subscriptionsError);
          throw subscriptionsError;
        }

        if (!subscriptions || subscriptions.length === 0) {
          debugLogger.subscription.warn('useSubscriptionBilling', 'Nenhuma subscription encontrada para este barbershop');
          setBillings([]);
          return;
        }

        // Terceira query: buscar clientes
        const clientIds = subscriptions.map(s => s.client_id);
        debugLogger.subscription.debug('useSubscriptionBilling', 'Query 3 - Buscando clients para IDs', clientIds);
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds);
        debugLogger.subscription.info('useSubscriptionBilling', `Clients encontrados: ${clients?.length || 0}`);
        
        if (clientsError) {
          debugLogger.subscription.error('useSubscriptionBilling', 'Erro ao buscar clients', clientsError);
          throw clientsError;
        }

        // Quarta query: buscar providers
        const providerIds = subscriptions.map(s => s.provider_id);
        debugLogger.subscription.debug('useSubscriptionBilling', 'Query 4 - Buscando providers para IDs', providerIds);
        const { data: providers, error: providersError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', providerIds);
        debugLogger.subscription.info('useSubscriptionBilling', `Providers encontrados: ${providers?.length || 0}`);
        
        if (providersError) {
          debugLogger.subscription.error('useSubscriptionBilling', 'Erro ao buscar providers', providersError);
          throw providersError;
        }

        // Quinta query: buscar planos
        const planIds = subscriptions.map(s => s.plan_id);
        debugLogger.subscription.debug('useSubscriptionBilling', 'Query 5 - Buscando plans para IDs', planIds);
        const { data: plans, error: plansError } = await supabase
          .from('provider_subscription_plans')
          .select('id, name')
          .in('id', planIds);
        debugLogger.subscription.info('useSubscriptionBilling', `Plans encontrados: ${plans?.length || 0}`);
        
        if (plansError) {
          debugLogger.subscription.error('useSubscriptionBilling', 'Erro ao buscar plans', plansError);
          throw plansError;
        }

        // Combinar os dados
        debugLogger.subscription.debug('useSubscriptionBilling', 'Step 6: Combinando dados');
        const formattedBillings: SubscriptionBilling[] = financialRecords
          .map((record: any) => {
            const subscription = subscriptions.find(s => s.id === record.subscription_id);
            if (!subscription) {
              debugLogger.subscription.warn('useSubscriptionBilling', `Subscription não encontrada para record: ${record.subscription_id}`);
              return null;
            }

            const client = clients?.find(c => c.id === subscription.client_id);
            const provider = providers?.find(p => p.id === subscription.provider_id);
            const plan = plans?.find(p => p.id === subscription.plan_id);

            if (!client) debugLogger.subscription.warn('useSubscriptionBilling', `Client não encontrado para ID: ${subscription.client_id}`);
            if (!provider) debugLogger.subscription.warn('useSubscriptionBilling', `Provider não encontrado para ID: ${subscription.provider_id}`);
            if (!plan) debugLogger.subscription.warn('useSubscriptionBilling', `Plan não encontrado para ID: ${subscription.plan_id}`);

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

        debugLogger.subscription.info('useSubscriptionBilling', `Final formatted billings: ${formattedBillings.length}`);
        debugLogger.subscription.debug('useSubscriptionBilling', 'Final billings data', formattedBillings);

        setBillings(formattedBillings);
      } catch (error) {
        debugLogger.subscription.error('useSubscriptionBilling', 'Erro durante fetch', error);
        setError('Erro ao carregar cobranças');
      } finally {
        setLoading(false);
      }
  }, [profile?.barbershop_id, memoizedFilters]);

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
  }, [fetchBillings]);

  return {
    billings,
    loading,
    error,
    refetch: fetchBillings,
    updateBillingStatus,
    addNotes
  };
};