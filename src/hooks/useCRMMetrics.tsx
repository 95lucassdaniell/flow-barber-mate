import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CRMMetrics {
  totalClients: number;
  newClients30d: {
    count: number;
    growthRate: number;
  };
  avgCLV: number;
  retentionRate: number;
  avgFrequencyDays: number;
  npsScore: number;
}

export const useCRMMetrics = () => {
  const [metrics, setMetrics] = useState<CRMMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const fetchCRMMetrics = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      
      // Buscar todos os clientes
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, created_at')
        .eq('barbershop_id', profile.barbershop_id);

      if (clientsError) throw clientsError;

      // Buscar appointments para calcular CLV, retenção e frequência
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('client_id, total_price, appointment_date')
        .eq('barbershop_id', profile.barbershop_id)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Cálculos
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      // Total de clientes
      const totalClients = clients?.length || 0;

      // Novos clientes (30d)
      const newClients30d = clients?.filter(client => 
        new Date(client.created_at) >= thirtyDaysAgo
      ).length || 0;

      const newClients60d = clients?.filter(client => 
        new Date(client.created_at) >= sixtyDaysAgo && 
        new Date(client.created_at) < thirtyDaysAgo
      ).length || 0;

      const growthRate = newClients60d > 0 ? 
        ((newClients30d - newClients60d) / newClients60d) * 100 : 
        newClients30d > 0 ? 100 : 0;

      // CLV Médio
      const clientRevenues = new Map<string, number>();
      appointments?.forEach(apt => {
        const current = clientRevenues.get(apt.client_id) || 0;
        clientRevenues.set(apt.client_id, current + (apt.total_price || 0));
      });

      const avgCLV = clientRevenues.size > 0 ? 
        Array.from(clientRevenues.values()).reduce((sum, val) => sum + val, 0) / clientRevenues.size : 0;

      // Taxa de Retenção (clientes que retornaram nos últimos 6 meses)
      const clientVisits = new Map<string, Date[]>();
      appointments?.forEach(apt => {
        const visits = clientVisits.get(apt.client_id) || [];
        visits.push(new Date(apt.appointment_date));
        clientVisits.set(apt.client_id, visits);
      });

      const eligibleClients = Array.from(clientVisits.entries()).filter(([_, visits]) => 
        visits.length >= 2 && visits[0] < sixMonthsAgo
      );

      const returnedClients = eligibleClients.filter(([_, visits]) => 
        visits.some(visit => visit >= sixMonthsAgo)
      );

      const retentionRate = eligibleClients.length > 0 ? 
        (returnedClients.length / eligibleClients.length) * 100 : 0;

      // Frequência Média (em dias)
      let totalDaysBetweenVisits = 0;
      let intervalCount = 0;

      clientVisits.forEach((visits) => {
        if (visits.length >= 2) {
          const sortedVisits = visits.sort((a, b) => a.getTime() - b.getTime());
          for (let i = 1; i < sortedVisits.length; i++) {
            const daysDiff = (sortedVisits[i].getTime() - sortedVisits[i-1].getTime()) / (1000 * 60 * 60 * 24);
            totalDaysBetweenVisits += daysDiff;
            intervalCount++;
          }
        }
      });

      const avgFrequencyDays = intervalCount > 0 ? 
        Math.round(totalDaysBetweenVisits / intervalCount) : 0;

      // NPS Score simulado baseado em padrões de comportamento
      const recentClients = Array.from(clientVisits.entries()).filter(([_, visits]) => {
        const lastVisit = visits[visits.length - 1];
        return lastVisit >= thirtyDaysAgo;
      });

      const promoters = recentClients.filter(([_, visits]) => visits.length >= 3).length;
      const detractors = recentClients.filter(([_, visits]) => {
        const lastVisit = visits[visits.length - 1];
        const daysSinceLastVisit = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastVisit > 45;
      }).length;

      const npsScore = recentClients.length > 0 ? 
        Math.max(0, Math.min(100, ((promoters - detractors) / recentClients.length) * 100)) : 75;

      setMetrics({
        totalClients,
        newClients30d: {
          count: newClients30d,
          growthRate
        },
        avgCLV,
        retentionRate,
        avgFrequencyDays,
        npsScore
      });

    } catch (err) {
      console.error('Erro ao buscar métricas CRM:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMMetrics();
  }, [profile?.barbershop_id]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchCRMMetrics
  };
};