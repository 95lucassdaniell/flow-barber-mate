import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { intelligentCache, globalState } from "@/lib/globalState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  monthly_revenue: number;
  services_used: number;
  average_ticket: number;
}

export interface SubscriptionBilling {
  id: string;
  subscription_id: string;
  client_name: string;
  provider_name: string;
  provider_id: string;
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

interface ConsolidatedSubscriptionData {
  stats: SubscriptionStats;
  billings: SubscriptionBilling[];
}

export const useIntelligentSubscriptionData = (
  filters?: BillingFilters,
  statsDateRange?: { startDate?: string; endDate?: string }
) => {
  const [data, setData] = useState<ConsolidatedSubscriptionData>({
    stats: {
      total_subscriptions: 0,
      active_subscriptions: 0,
      monthly_revenue: 0,
      services_used: 0,
      average_ticket: 0
    },
    billings: []
  });
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const { profile } = useAuth();

  // Debounce dos filtros
  const debouncedStatus = useDebouncedValue(filters?.status, 300);
  const debouncedStartDate = useDebouncedValue(filters?.startDate, 300);
  const debouncedEndDate = useDebouncedValue(filters?.endDate, 300);
  const debouncedProviderId = useDebouncedValue(filters?.providerId, 100);

  // Memoizar filtros para cache key
  const memoizedFilters = useMemo(() => ({
    barbershop_id: profile?.barbershop_id,
    status: debouncedStatus,
    startDate: debouncedStartDate,
    endDate: debouncedEndDate,
    providerId: debouncedProviderId,
    statsStartDate: statsDateRange?.startDate,
    statsEndDate: statsDateRange?.endDate
  }), [
    profile?.barbershop_id,
    debouncedStatus,
    debouncedStartDate, 
    debouncedEndDate,
    debouncedProviderId,
    statsDateRange?.startDate,
    statsDateRange?.endDate
  ]);

  // Gerar cache key única
  const cacheKey = useMemo(() => {
    const filterKey = `${memoizedFilters.status || 'all'}-${memoizedFilters.startDate || 'all'}-${memoizedFilters.endDate || 'all'}-${memoizedFilters.providerId || 'all'}`;
    const statsKey = `${memoizedFilters.statsStartDate || 'all'}-${memoizedFilters.statsEndDate || 'all'}`;
    return `subscription-data-${memoizedFilters.barbershop_id}-${filterKey}-${statsKey}`;
  }, [memoizedFilters]);

  const shouldFetch = useMemo(() => {
    return Boolean(memoizedFilters.barbershop_id) && 
           globalState.checkRateLimit(`intelligent-subscription-${memoizedFilters.barbershop_id}`, 3, 2000);
  }, [memoizedFilters.barbershop_id]);

  // Função consolidada que busca stats e billings em paralelo
  const fetchConsolidatedSubscriptionData = useCallback(async (): Promise<ConsolidatedSubscriptionData> => {
    if (!memoizedFilters.barbershop_id) {
      throw new Error('Barbershop ID não encontrado');
    }

    // Buscar assinaturas base
    const { data: subscriptions, error: subsError } = await supabase
      .from('client_subscriptions')
      .select(`
        id,
        client_id,
        provider_id,
        plan_id,
        status,
        remaining_services
      `)
      .eq('barbershop_id', memoizedFilters.barbershop_id);

    if (subsError) throw subsError;

    // Buscar registros financeiros com filtros
    let financialQuery = supabase
      .from('subscription_financial_records')
      .select('*')
      .order('due_date', { ascending: false });

    // Aplicar filtros de billing
    if (memoizedFilters.status && memoizedFilters.status !== 'all') {
      financialQuery = financialQuery.eq('status', memoizedFilters.status);
    }
    if (memoizedFilters.startDate) {
      financialQuery = financialQuery.gte('due_date', memoizedFilters.startDate);
    }
    if (memoizedFilters.endDate) {
      financialQuery = financialQuery.lte('due_date', memoizedFilters.endDate);
    }

    // Buscar dados relacionados em paralelo
    const [
      financialResponse,
      clientsResponse,
      providersResponse,
      plansResponse,
      usageResponse
    ] = await Promise.all([
      financialQuery,
      supabase.from('clients').select('id, name').eq('barbershop_id', memoizedFilters.barbershop_id),
      supabase.from('profiles').select('id, full_name').eq('barbershop_id', memoizedFilters.barbershop_id),
      supabase.from('provider_subscription_plans').select('id, name, monthly_price').eq('barbershop_id', memoizedFilters.barbershop_id),
      (() => {
        if (memoizedFilters.statsStartDate && memoizedFilters.statsEndDate) {
          return supabase
            .from('subscription_usage_history')
            .select('id, subscription_id')
            .gte('used_at', memoizedFilters.statsStartDate)
            .lte('used_at', memoizedFilters.statsEndDate);
        }
        return Promise.resolve({ data: [], error: null });
      })()
    ]);

    if (financialResponse.error) throw financialResponse.error;
    if (clientsResponse.error) throw clientsResponse.error;
    if (providersResponse.error) throw providersResponse.error;
    if (plansResponse.error) throw plansResponse.error;
    if (usageResponse.error) throw usageResponse.error;

    const financialRecords = financialResponse.data || [];
    const clients = clientsResponse.data || [];
    const providers = providersResponse.data || [];
    const plans = plansResponse.data || [];
    const usageData = usageResponse.data || [];

    // Criar mapas para lookup rápido
    const clientsMap = new Map(clients.map(c => [c.id, c]));
    const providersMap = new Map(providers.map(p => [p.id, p]));
    const plansMap = new Map(plans.map(p => [p.id, p]));

    // Filtrar assinaturas por provider se necessário
    let filteredSubscriptions = subscriptions || [];
    if (memoizedFilters.providerId && memoizedFilters.providerId !== 'all') {
      filteredSubscriptions = filteredSubscriptions.filter(s => s.provider_id === memoizedFilters.providerId);
    }

    // Calcular estatísticas
    const totalSubscriptions = filteredSubscriptions.length;
    const activeSubscriptions = filteredSubscriptions.filter(s => s.status === 'active').length;
    
    const activePlans = filteredSubscriptions
      .filter(s => s.status === 'active')
      .map(s => plansMap.get(s.plan_id))
      .filter(Boolean);
    
    const monthlyRevenue = activePlans.reduce((sum, plan) => sum + (plan?.monthly_price || 0), 0);
    const averageTicket = activeSubscriptions > 0 ? monthlyRevenue / activeSubscriptions : 0;
    
    // Contar serviços usados
    const subscriptionIds = filteredSubscriptions.map(s => s.id);
    const servicesUsed = usageData.filter(u => subscriptionIds.includes(u.subscription_id)).length;

    // Processar billings
    const validFinancialRecords = financialRecords.filter(record => {
      const subscription = filteredSubscriptions.find(s => s.id === record.subscription_id);
      return subscription !== undefined;
    });

    const billings: SubscriptionBilling[] = validFinancialRecords.map(record => {
      const subscription = filteredSubscriptions.find(s => s.id === record.subscription_id);
      const client = clientsMap.get(subscription?.client_id);
      const provider = providersMap.get(subscription?.provider_id);
      const plan = plansMap.get(subscription?.plan_id);

      return {
        id: record.id,
        subscription_id: record.subscription_id,
        client_name: client?.name || 'Cliente não encontrado',
        provider_name: provider?.full_name || 'Provider não encontrado',
        provider_id: subscription?.provider_id || '',
        plan_name: plan?.name || 'Plano não encontrado',
        amount: record.amount,
        commission_amount: record.commission_amount,
        net_amount: record.net_amount,
        due_date: record.due_date,
        status: record.status as 'pending' | 'paid' | 'overdue',
        payment_date: record.payment_date,
        payment_method: record.payment_method,
        notes: record.notes,
        created_at: record.created_at
      };
    });

    return {
      stats: {
        total_subscriptions: totalSubscriptions,
        active_subscriptions: activeSubscriptions,
        monthly_revenue: monthlyRevenue,
        services_used: servicesUsed,
        average_ticket: averageTicket
      },
      billings
    };
  }, [memoizedFilters]);

  // Buscar dados com cache inteligente
  const fetchData = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    // Tentar buscar do cache primeiro
    const cached = intelligentCache.getIntelligent<ConsolidatedSubscriptionData>(cacheKey);
    
    if (cached.data && cached.fromCache) {
      setData(cached.data);
      setFromCache(true);
      setLoading(false);
      console.log(`💨 Dados de assinatura carregados do cache: ${cacheKey}`);
      return;
    }

    // Se não está no cache, buscar do banco
    setFromCache(false);
    setLoading(true);

    const circuitKey = `intelligent-subscription-consolidated-${memoizedFilters.barbershop_id}`;
    if (!globalState.checkCircuitBreaker(circuitKey, 2, 10000)) {
      setLoading(false);
      return;
    }

    try {
      const consolidatedData = await fetchConsolidatedSubscriptionData();
      
      // Salvar no cache com triggers de invalidação
      intelligentCache.setWithInvalidation(
        cacheKey,
        consolidatedData,
        600000, // 10 minutos para dados de assinatura
        ['subscription-stats', 'subscription-billing', 'subscription_financial_records', 'client_subscriptions'],
        memoizedFilters.barbershop_id
      );

      setData(consolidatedData);
      console.log(`🔥 Dados de assinatura atualizados e cacheados: ${cacheKey}`);
    } catch (error) {
      console.error('Erro ao buscar dados de assinatura:', error);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, cacheKey, fetchConsolidatedSubscriptionData, memoizedFilters.barbershop_id]);

  // Função para forçar atualização
  const refetch = useCallback(() => {
    intelligentCache.invalidateByTrigger('subscription-stats', memoizedFilters.barbershop_id);
    intelligentCache.invalidateByTrigger('subscription-billing', memoizedFilters.barbershop_id);
    fetchData();
  }, [fetchData, memoizedFilters.barbershop_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats: data.stats,
    billings: data.billings,
    loading,
    fromCache,
    refetch,
  };
};