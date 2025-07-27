import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BarbershopPerformance {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  totalUsers: number;
  totalAppointments: number;
  monthlyRevenue: number;
  appointmentsToday: number;
  salesToday: number;
  commandsOpen: number;
  createdAt: string;
}

export const useBarbershopPerformance = () => {
  const [barbershops, setBarbershops] = useState<BarbershopPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBarbershopPerformance = async () => {
    try {
      setLoading(true);

      // Buscar todas as barbearias com estatísticas básicas
      const { data: barbershopData } = await supabase
        .from('barbershops')
        .select('*')
        .order('created_at', { ascending: false });

      if (barbershopData) {
        // Para cada barbearia, buscar estatísticas de performance
        const performancePromises = barbershopData.map(async (barbershop) => {
          try {
            const { data: performanceData } = await supabase
              .rpc('get_barbershop_performance_stats', { 
                barbershop_uuid: barbershop.id 
              });

            let appointmentsToday = 0;
            let salesToday = 0;
            let commandsOpen = 0;

            if (performanceData) {
              performanceData.forEach((metric: any) => {
                switch (metric.metric_name) {
                  case 'appointments_today':
                    appointmentsToday = metric.metric_value;
                    break;
                  case 'sales_today':
                    salesToday = metric.metric_value;
                    break;
                  case 'commands_open':
                    commandsOpen = metric.metric_value;
                    break;
                }
              });
            }

            return {
              id: barbershop.id,
              name: barbershop.name,
              slug: barbershop.slug,
              status: barbershop.status,
              plan: barbershop.plan,
              totalUsers: barbershop.total_users || 0,
              totalAppointments: barbershop.total_appointments || 0,
              monthlyRevenue: barbershop.monthly_revenue || 0,
              appointmentsToday,
              salesToday,
              commandsOpen,
              createdAt: barbershop.created_at,
            };
          } catch (error) {
            console.error(`Erro ao buscar performance da barbearia ${barbershop.id}:`, error);
            return {
              id: barbershop.id,
              name: barbershop.name,
              slug: barbershop.slug,
              status: barbershop.status,
              plan: barbershop.plan,
              totalUsers: barbershop.total_users || 0,
              totalAppointments: barbershop.total_appointments || 0,
              monthlyRevenue: barbershop.monthly_revenue || 0,
              appointmentsToday: 0,
              salesToday: 0,
              commandsOpen: 0,
              createdAt: barbershop.created_at,
            };
          }
        });

        const performanceResults = await Promise.all(performancePromises);
        setBarbershops(performanceResults);
      }

    } catch (error) {
      console.error('Erro ao buscar performance das barbearias:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbershopPerformance();
  }, []);

  return {
    barbershops,
    loading,
    refetch: fetchBarbershopPerformance
  };
};