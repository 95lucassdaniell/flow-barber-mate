import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { globalState } from "@/lib/globalState";

export interface FinancialStats {
  totalRevenue: number;
  totalCommissions: number;
  totalSales: number;
  averageTicket: number;
}

export interface BarberRanking {
  id: string;
  full_name: string;
  totalCommissions: number;
  totalSales: number;
  salesCount: number;
}

export interface ProductRanking {
  id: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
  salesCount: number;
}

export interface CommissionData {
  id: string;
  commission_amount: number;
  commission_date: string;
  sale_id: string;
  barber: {
    full_name: string;
  };
  sale: {
    client: {
      name: string;
    };
    final_amount: number;
  };
}

export function useFinancialData(
  startDate?: string,
  endDate?: string,
  barberId?: string
) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalCommissions: 0,
    totalSales: 0,
    averageTicket: 0,
  });
  const [barberRankings, setBarberRankings] = useState<BarberRanking[]>([]);
  const [productRankings, setProductRankings] = useState<ProductRanking[]>([]);
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [commissionsLoading, setCommissionsLoading] = useState(false);

  // Memoizar filtros para evitar re-renders
  const filters = useMemo(() => ({
    barbershop_id: profile?.barbershop_id,
    startDate,
    endDate,
    barberId
  }), [profile?.barbershop_id, startDate, endDate, barberId]);

  // Verificar se deve executar
  const shouldFetch = useMemo(() => {
    return Boolean(filters.barbershop_id) && 
           globalState.checkRateLimit(`financial-${filters.barbershop_id}`, 2, 3000);
  }, [filters.barbershop_id]);

  const fetchFinancialStats = useCallback(async () => {
    if (!shouldFetch || !filters.barbershop_id) return;

    const circuitKey = `financial-stats-${filters.barbershop_id}`;
    if (!globalState.checkCircuitBreaker(circuitKey, 3, 5000)) return;

    setStatsLoading(true);
    
    try {
      let commandsQuery = supabase
        .from('commands')
        .select('id, total_amount, created_at, barber_id, status')
        .eq('barbershop_id', filters.barbershop_id)
        .eq('status', 'closed');

      if (filters.startDate) commandsQuery = commandsQuery.gte('created_at', filters.startDate);
      if (filters.endDate) commandsQuery = commandsQuery.lte('created_at', filters.endDate + ' 23:59:59');
      if (filters.barberId) commandsQuery = commandsQuery.eq('barber_id', filters.barberId);

      const { data: commands, error: commandsError } = await commandsQuery;
      
      if (commandsError) {
        console.error('Error fetching commands for stats:', commandsError);
        return;
      }

      let totalCommissions = 0;
      if (commands && commands.length > 0) {
        const commandIds = commands.map(command => command.id);
        
        const batchSize = 500;
        for (let i = 0; i < commandIds.length; i += batchSize) {
          const batch = commandIds.slice(i, i + batchSize);
          
          try {
            const { data: commandItems, error: commandItemsError } = await supabase
              .from('command_items')
              .select('commission_amount')
              .in('command_id', batch);
            
            if (!commandItemsError && commandItems) {
              totalCommissions += commandItems.reduce((sum, item) => sum + Number(item.commission_amount), 0);
            }
          } catch (batchError) {
            console.error(`Batch error ${i}-${i+batchSize}:`, batchError);
          }
        }
      }

      const totalRevenue = commands?.reduce((sum, command) => sum + Number(command.total_amount), 0) || 0;
      const totalSales = commands?.length || 0;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

      setStats({
        totalRevenue,
        totalCommissions,
        totalSales,
        averageTicket,
      });
    } catch (error) {
      console.error('fetchFinancialStats error:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [shouldFetch, filters]);

  const fetchBarberRankings = useCallback(async () => {
    if (!shouldFetch || !filters.barbershop_id) return;

    const circuitKey = `barber-rankings-${filters.barbershop_id}`;
    if (!globalState.checkCircuitBreaker(circuitKey, 3, 5000)) return;

    setRankingsLoading(true);
    setBarberRankings([]);
    
    try {
      let commandItemsQuery = supabase
        .from('command_items')
        .select(`
          commission_amount,
          commands!inner(
            id,
            barber_id,
            total_amount,
            created_at,
            barbershop_id,
            status
          )
        `)
        .eq('commands.barbershop_id', filters.barbershop_id)
        .eq('commands.status', 'closed');

      if (filters.startDate) commandItemsQuery = commandItemsQuery.gte('commands.created_at', filters.startDate);
      if (filters.endDate) commandItemsQuery = commandItemsQuery.lte('commands.created_at', filters.endDate + ' 23:59:59');
      if (filters.barberId) commandItemsQuery = commandItemsQuery.eq('commands.barber_id', filters.barberId);

      const { data: commandItems, error: itemsError } = await commandItemsQuery;
      
      if (itemsError) {
        console.error('fetchBarberRankings error:', itemsError);
        return;
      }

      const { data: providers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('barbershop_id', filters.barbershop_id)
        .eq('role', 'barber');

      const barberStats = new Map();

      providers?.forEach(provider => {
        barberStats.set(provider.id, {
          id: provider.id,
          full_name: provider.full_name,
          totalCommissions: 0,
          totalSales: 0,
          salesCount: 0
        });
      });

      const processedCommands = new Set();
      
      commandItems?.forEach((item: any) => {
        const command = item.commands;
        const barberId = command.barber_id;
        const commandId = command.id;
        
        const stats = barberStats.get(barberId);
        if (stats) {
          stats.totalCommissions += item.commission_amount || 0;
          
          if (!processedCommands.has(commandId)) {
            stats.totalSales += command.total_amount || 0;
            stats.salesCount += 1;
            processedCommands.add(commandId);
          }
        }
      });

      const rankings = Array.from(barberStats.values())
        .sort((a, b) => b.totalCommissions - a.totalCommissions);

      setBarberRankings(rankings);
    } catch (error) {
      console.error('fetchBarberRankings error:', error);
    } finally {
      setRankingsLoading(false);
    }
  }, [shouldFetch, filters]);

  const fetchCommissions = useCallback(async () => {
    if (!shouldFetch || !filters.barbershop_id) return;

    const circuitKey = `commissions-${filters.barbershop_id}`;
    if (!globalState.checkCircuitBreaker(circuitKey, 3, 5000)) return;

    setCommissionsLoading(true);

    try {
      let query = supabase
        .from('command_items')
        .select(`
          id,
          commission_amount,
          commands!inner(
            id,
            created_at,
            total_amount,
            barbershop_id,
            barber_id,
            client_id,
            status,
            profiles!commands_barber_id_fkey(full_name),
            clients!commands_client_id_fkey(name)
          )
        `)
        .eq('commands.barbershop_id', filters.barbershop_id)
        .eq('commands.status', 'closed');

      if (filters.startDate) query = query.gte('commands.created_at', filters.startDate);
      if (filters.endDate) query = query.lte('commands.created_at', filters.endDate + ' 23:59:59');
      if (filters.barberId) query = query.eq('commands.barber_id', filters.barberId);

      const { data, error: commissionsError } = await query;
      
      if (commissionsError) {
        console.error('fetchCommissions error:', commissionsError);
        return;
      }
      
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        commission_amount: item.commission_amount,
        commission_date: item.commands.created_at.split('T')[0],
        sale_id: item.commands.id,
        barber: { full_name: item.commands.profiles?.full_name || 'N/A' },
        sale: {
          final_amount: item.commands.total_amount,
          client: { name: item.commands.clients?.name || 'N/A' }
        }
      })) || [];

      formattedData.sort((a, b) => new Date(b.commission_date).getTime() - new Date(a.commission_date).getTime());

      setCommissions(formattedData);
    } catch (error) {
      console.error('fetchCommissions error:', error);
    } finally {
      setCommissionsLoading(false);
    }
  }, [shouldFetch, filters]);

  useEffect(() => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFinancialStats(),
        fetchBarberRankings(),
        fetchCommissions(),
      ]);
      setLoading(false);
    };

    fetchData();
  }, [shouldFetch, fetchFinancialStats, fetchBarberRankings, fetchCommissions]);

  return {
    stats,
    barberRankings,
    productRankings,
    commissions,
    loading,
    statsLoading,
    rankingsLoading,
    commissionsLoading,
    refetch: () => {
      fetchFinancialStats();
      fetchBarberRankings();
      fetchCommissions();
    },
  };
}