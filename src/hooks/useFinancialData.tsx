import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

  // ID único para rastrear requests
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Debug logs para os filtros
  console.log(`[${requestId}] useFinancialData - Filters:`, { startDate, endDate, barberId });

  const fetchFinancialStats = async () => {
    if (!profile?.barbershop_id) {
      console.log(`[${requestId}] fetchFinancialStats: No barbershop_id found`);
      return;
    }

    setStatsLoading(true);
    console.log(`[${requestId}] fetchFinancialStats: Starting - barbershop:`, profile.barbershop_id);
    console.log(`[${requestId}] fetchFinancialStats: Filters:`, { startDate, endDate, barberId });
    
    try {
      // Buscar comandos primeiro com filtros aplicados
      let commandsQuery = supabase
        .from('commands')
        .select('id, total_amount, created_at, barber_id, status')
        .eq('barbershop_id', profile.barbershop_id)
        .eq('status', 'closed'); // Apenas comandos fechados

      if (startDate) commandsQuery = commandsQuery.gte('created_at', startDate);
      if (endDate) commandsQuery = commandsQuery.lte('created_at', endDate + ' 23:59:59');
      if (barberId) commandsQuery = commandsQuery.eq('barber_id', barberId);

      const { data: commands, error: commandsError } = await commandsQuery;
      
      if (commandsError) {
        console.error('Error fetching commands for stats:', commandsError);
        return;
      }
      
      console.log('useFinancialData: Commands found for stats:', commands?.length || 0);

      // Se há comandos, buscar command_items usando os IDs dos comandos
      let totalCommissions = 0;
      if (commands && commands.length > 0) {
        const commandIds = commands.map(command => command.id);
        
        const { data: commandItems, error: commandItemsError } = await supabase
          .from('command_items')
          .select('commission_amount')
          .in('command_id', commandIds);
        
        if (commandItemsError) {
          console.error('Error fetching command items for stats:', commandItemsError);
        } else {
          console.log('useFinancialData: Command items found for stats:', commandItems?.length || 0);
          totalCommissions = commandItems?.reduce((sum, item) => sum + Number(item.commission_amount), 0) || 0;
        }
      }

      const totalRevenue = commands?.reduce((sum, command) => sum + Number(command.total_amount), 0) || 0;
      const totalSales = commands?.length || 0;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

      console.log(`[${requestId}] fetchFinancialStats: Calculated stats:`, { totalRevenue, totalCommissions, totalSales, averageTicket });

      setStats({
        totalRevenue,
        totalCommissions,
        totalSales,
        averageTicket,
      });
    } catch (error) {
      console.error(`[${requestId}] fetchFinancialStats: Error:`, error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchBarberRankings = async () => {
    if (!profile?.barbershop_id) return;

    setRankingsLoading(true);
    // Limpar rankings antes de buscar novos dados
    setBarberRankings([]);
    
    console.log(`[${requestId}] fetchBarberRankings: Starting - barbershop:`, profile.barbershop_id);
    console.log(`[${requestId}] fetchBarberRankings: Filters:`, { startDate, endDate, barberId });
    
    try {
      // Use JOIN para buscar command_items com dados de comandos diretamente
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
        .eq('commands.barbershop_id', profile.barbershop_id)
        .eq('commands.status', 'closed');

      if (startDate) commandItemsQuery = commandItemsQuery.gte('commands.created_at', startDate);
      if (endDate) commandItemsQuery = commandItemsQuery.lte('commands.created_at', endDate + ' 23:59:59');
      if (barberId) commandItemsQuery = commandItemsQuery.eq('commands.barber_id', barberId);

      const { data: commandItems, error: itemsError } = await commandItemsQuery;
      
      if (itemsError) {
        console.error(`[${requestId}] fetchBarberRankings: Command items error:`, itemsError);
        return;
      }

      console.log(`[${requestId}] fetchBarberRankings: Found command items:`, commandItems?.length || 0);

      // Buscar perfis dos barbeiros
      const { data: providers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('barbershop_id', profile.barbershop_id)
        .eq('role', 'barber');

      console.log(`[${requestId}] fetchBarberRankings: Found providers:`, providers?.length || 0);

      // Calcular rankings
      const barberStats = new Map();

      // Inicializar todos os barbeiros com estatísticas zeradas
      providers?.forEach(provider => {
        barberStats.set(provider.id, {
          id: provider.id,
          full_name: provider.full_name,
          totalCommissions: 0,
          totalSales: 0,
          salesCount: 0
        });
      });

      // Processar dados dos command_items
      const processedCommands = new Set();
      
      commandItems?.forEach((item: any) => {
        const command = item.commands;
        const barberId = command.barber_id;
        const commandId = command.id;
        
        const stats = barberStats.get(barberId);
        if (stats) {
          // Adicionar comissão
          stats.totalCommissions += item.commission_amount || 0;
          
          // Adicionar dados de comando apenas uma vez por comando (evitar contagem dupla se múltiplos itens por comando)
          if (!processedCommands.has(commandId)) {
            stats.totalSales += command.total_amount || 0;
            stats.salesCount += 1;
            processedCommands.add(commandId);
          }
        }
      });

      // Converter para array e ordenar por total de comissões
      const rankings = Array.from(barberStats.values())
        .sort((a, b) => b.totalCommissions - a.totalCommissions);

      console.log(`[${requestId}] fetchBarberRankings: Final rankings:`, rankings);
      setBarberRankings(rankings);
    } catch (error) {
      console.error(`[${requestId}] fetchBarberRankings: Unexpected error:`, error);
    } finally {
      setRankingsLoading(false);
    }
  };

  const fetchCommissions = async () => {
    if (!profile?.barbershop_id) return;

    setCommissionsLoading(true);
    console.log(`[${requestId}] fetchCommissions: Starting`);

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
        .eq('commands.barbershop_id', profile.barbershop_id)
        .eq('commands.status', 'closed');

      if (startDate) query = query.gte('commands.created_at', startDate);
      if (endDate) query = query.lte('commands.created_at', endDate + ' 23:59:59');
      if (barberId) query = query.eq('commands.barber_id', barberId);

      // Buscar dados sem ordenação para evitar erro com joins
      const { data, error: commissionsError } = await query;
      
      if (commissionsError) {
        console.error(`[${requestId}] fetchCommissions: Error:`, commissionsError);
        return;
      }
      
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        commission_amount: item.commission_amount,
        commission_date: item.commands.created_at.split('T')[0], // Extrair apenas a data
        sale_id: item.commands.id,
        barber: { full_name: item.commands.profiles?.full_name || 'N/A' },
        sale: {
          final_amount: item.commands.total_amount,
          client: { name: item.commands.clients?.name || 'N/A' }
        }
      })) || [];

      // Ordenar manualmente por data de comando (mais recente primeiro)
      formattedData.sort((a, b) => new Date(b.commission_date).getTime() - new Date(a.commission_date).getTime());

      console.log(`[${requestId}] fetchCommissions: Formatted data:`, formattedData.length, 'commissions');
      setCommissions(formattedData);
    } catch (error) {
      console.error(`[${requestId}] fetchCommissions: Error:`, error);
    } finally {
      setCommissionsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFinancialStats(),
        fetchBarberRankings(),
        fetchCommissions(),
      ]);
      setLoading(false);
    };

    if (profile?.barbershop_id) {
      fetchData();
    }
  }, [profile?.barbershop_id, startDate, endDate, barberId]);

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