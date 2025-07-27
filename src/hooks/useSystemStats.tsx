import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SystemStats {
  totalBarbershops: number;
  totalUsers: number;
  totalAppointments: number;
  totalRevenue: number;
  activeBarbershops: number;
  trialBarbershops: number;
  overdueAccounts: number;
  todayAppointments: number;
  monthlyGrowth: number;
}

interface TableStats {
  tableName: string;
  rowCount: number;
  tableSize: string;
  indexSize: string;
}

export const useSystemStats = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalBarbershops: 0,
    totalUsers: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    activeBarbershops: 0,
    trialBarbershops: 0,
    overdueAccounts: 0,
    todayAppointments: 0,
    monthlyGrowth: 0,
  });
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);

      // Buscar estatísticas financeiras globais
      const { data: financialData } = await supabase
        .rpc('get_financial_overview');

      // Buscar estatísticas das tabelas
      const { data: tableStatsData } = await supabase
        .rpc('get_table_stats');

      // Buscar total de usuários
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Buscar agendamentos de hoje
      const today = new Date().toISOString().split('T')[0];
      const { count: todayAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .eq('appointment_date', today);

      // Buscar total de agendamentos
      const { count: totalAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact' });

      if (financialData && financialData.length > 0) {
        const financial = financialData[0];
        setStats({
          totalBarbershops: financial.total_active_accounts + financial.total_trial_accounts + financial.total_cancelled_accounts + financial.total_overdue_accounts,
          totalUsers: totalUsers || 0,
          totalAppointments: totalAppointments || 0,
          totalRevenue: financial.monthly_revenue || 0,
          activeBarbershops: financial.total_active_accounts || 0,
          trialBarbershops: financial.total_trial_accounts || 0,
          overdueAccounts: financial.total_overdue_accounts || 0,
          todayAppointments: todayAppointments || 0,
          monthlyGrowth: 0, // Calcular crescimento mensal se necessário
        });
      }

      if (tableStatsData) {
        setTableStats(tableStatsData.map((stat: any) => ({
          tableName: stat.table_name,
          rowCount: stat.row_count,
          tableSize: stat.table_size,
          indexSize: stat.index_size,
        })));
      }

    } catch (error) {
      console.error('Erro ao buscar estatísticas do sistema:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStats();
  }, []);

  return {
    stats,
    tableStats,
    loading,
    refetch: fetchSystemStats
  };
};