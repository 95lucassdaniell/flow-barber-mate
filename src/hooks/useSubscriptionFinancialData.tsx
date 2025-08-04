import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  monthly_revenue: number;
  services_used: number;
  average_ticket: number;
}

export const useSubscriptionFinancialData = (startDate?: string, endDate?: string) => {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchSubscriptionStats = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);

      // Buscar assinaturas
      const { data: subscriptions, error: subsError } = await supabase
        .from('client_subscriptions')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id);

      if (subsError) throw subsError;

      if (!subscriptions || subscriptions.length === 0) {
        setStats({
          total_subscriptions: 0,
          active_subscriptions: 0,
          monthly_revenue: 0,
          services_used: 0,
          average_ticket: 0,
        });
        return;
      }

      const totalSubscriptions = subscriptions.length;
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
      
      // Buscar planos para calcular receita
      const activePlanIds = subscriptions
        .filter(s => s.status === 'active')
        .map(s => s.plan_id);

      let monthlyRevenue = 0;
      if (activePlanIds.length > 0) {
        const { data: plans, error: plansError } = await supabase
          .from('provider_subscription_plans')
          .select('id, monthly_price')
          .in('id', activePlanIds);

        if (!plansError && plans) {
          monthlyRevenue = plans.reduce((sum, plan) => sum + (plan.monthly_price || 0), 0);
        }
      }

      // Contar serviços utilizados no período
      let servicesUsed = 0;
      if (startDate && endDate) {
        const { data: usageData, error: usageError } = await supabase
          .from('subscription_usage_history')
          .select('id')
          .gte('used_at', startDate)
          .lte('used_at', endDate)
          .in('subscription_id', subscriptions.map(s => s.id));

        if (!usageError && usageData) {
          servicesUsed = usageData.length;
        }
      } else {
        // Se não há filtro de data, buscar total de usos
        const { data: allUsage, error: allUsageError } = await supabase
          .from('subscription_usage_history')
          .select('id')
          .in('subscription_id', subscriptions.map(s => s.id));

        if (!allUsageError && allUsage) {
          servicesUsed = allUsage.length;
        }
      }

      const averageTicket = activeSubscriptions > 0 ? monthlyRevenue / activeSubscriptions : 0;

      setStats({
        total_subscriptions: totalSubscriptions,
        active_subscriptions: activeSubscriptions,
        monthly_revenue: monthlyRevenue,
        services_used: servicesUsed,
        average_ticket: averageTicket,
      });

    } catch (error) {
      console.error('Erro ao buscar dados financeiros de assinaturas:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchSubscriptionStats();
    }
  }, [profile?.barbershop_id, startDate, endDate]);

  return {
    stats,
    loading,
    refetch: fetchSubscriptionStats,
  };
};