import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { intelligentCache, globalState } from "@/lib/globalState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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

interface ConsolidatedFinancialData {
  stats: FinancialStats;
  barberRankings: BarberRanking[];
  commissions: CommissionData[];
}

export function useIntelligentFinancialData(
  startDate?: string,
  endDate?: string,
  barberId?: string
) {
  const { profile } = useAuth();
  const [data, setData] = useState<ConsolidatedFinancialData>({
    stats: { totalRevenue: 0, totalCommissions: 0, totalSales: 0, averageTicket: 0 },
    barberRankings: [],
    commissions: []
  });
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  // Debounce dos filtros para evitar muitas consultas
  const debouncedStartDate = useDebouncedValue(startDate, 300);
  const debouncedEndDate = useDebouncedValue(endDate, 300);
  const debouncedBarberId = useDebouncedValue(barberId, 100);

  // Memoizar filtros para cache key
  const filters = useMemo(() => ({
    barbershop_id: profile?.barbershop_id,
    startDate: debouncedStartDate,
    endDate: debouncedEndDate,
    barberId: debouncedBarberId
  }), [profile?.barbershop_id, debouncedStartDate, debouncedEndDate, debouncedBarberId]);

  // Gerar cache key única
  const cacheKey = useMemo(() => {
    const key = `financial-data-${filters.barbershop_id}-${filters.startDate || 'all'}-${filters.endDate || 'all'}-${filters.barberId || 'all'}`;
    return key;
  }, [filters]);

  // Verificar se deve executar
  const shouldFetch = useMemo(() => {
    return Boolean(filters.barbershop_id) && 
           globalState.checkRateLimit(`intelligent-financial-${filters.barbershop_id}`, 3, 2000);
  }, [filters.barbershop_id]);

  // Função otimizada que busca todos os dados em uma consulta consolidada
  const fetchConsolidatedFinancialData = useCallback(async (): Promise<ConsolidatedFinancialData> => {
    if (!filters.barbershop_id) {
      throw new Error('Barbershop ID não encontrado');
    }

    // Consulta consolidada otimizada com JOIN
    let commandItemsQuery = supabase
      .from('command_items')
      .select(`
        id,
        commission_amount,
        commands!inner(
          id,
          barber_id,
          client_id,
          total_amount,
          created_at,
          barbershop_id,
          status,
          profiles!commands_barber_id_fkey(id, full_name),
          clients!commands_client_id_fkey(id, name)
        )
      `)
      .eq('commands.barbershop_id', filters.barbershop_id)
      .eq('commands.status', 'closed');

    // Aplicar filtros
    if (filters.startDate) {
      commandItemsQuery = commandItemsQuery.gte('commands.created_at', filters.startDate);
    }
    if (filters.endDate) {
      commandItemsQuery = commandItemsQuery.lte('commands.created_at', filters.endDate + ' 23:59:59');
    }
    if (filters.barberId) {
      commandItemsQuery = commandItemsQuery.eq('commands.barber_id', filters.barberId);
    }

    const { data: commandItems, error } = await commandItemsQuery;
    
    if (error) {
      console.error('fetchConsolidatedFinancialData error:', error);
      throw error;
    }

    // Processar dados de forma eficiente
    const commandsMap = new Map();
    const barberStatsMap = new Map();
    let totalCommissions = 0;
    const commissions: CommissionData[] = [];

    // Buscar perfis de barbeiros uma só vez
    const { data: allBarbers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('barbershop_id', filters.barbershop_id)
      .eq('role', 'barber');

    // Inicializar stats dos barbeiros
    allBarbers?.forEach(barber => {
      barberStatsMap.set(barber.id, {
        id: barber.id,
        full_name: barber.full_name,
        totalCommissions: 0,
        totalSales: 0,
        salesCount: 0
      });
    });

    // Processar items e comandos
    commandItems?.forEach((item: any) => {
      const command = item.commands;
      const commandId = command.id;
      const barberId = command.barber_id;

      // Acumular comissões
      const commissionAmount = Number(item.commission_amount) || 0;
      totalCommissions += commissionAmount;

      // Processar comando único
      if (!commandsMap.has(commandId)) {
        commandsMap.set(commandId, {
          id: commandId,
          barber_id: barberId,
          total_amount: Number(command.total_amount) || 0,
          created_at: command.created_at
        });

        // Atualizar stats do barbeiro
        const barberStats = barberStatsMap.get(barberId);
        if (barberStats) {
          barberStats.totalSales += Number(command.total_amount) || 0;
          barberStats.salesCount += 1;
        }
      }

      // Atualizar comissões do barbeiro
      const barberStats = barberStatsMap.get(barberId);
      if (barberStats) {
        barberStats.totalCommissions += commissionAmount;
      }

      // Adicionar à lista de comissões
      commissions.push({
        id: item.id,
        commission_amount: commissionAmount,
        commission_date: command.created_at.split('T')[0],
        sale_id: commandId,
        barber: { 
          full_name: command.profiles?.full_name || 'N/A' 
        },
        sale: {
          final_amount: Number(command.total_amount) || 0,
          client: { 
            name: command.clients?.name || 'N/A' 
          }
        }
      });
    });

    // Calcular estatísticas finais
    const commands = Array.from(commandsMap.values());
    const totalRevenue = commands.reduce((sum, cmd) => sum + cmd.total_amount, 0);
    const totalSales = commands.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Ordenar dados
    const barberRankings = Array.from(barberStatsMap.values())
      .sort((a, b) => b.totalCommissions - a.totalCommissions);

    commissions.sort((a, b) => new Date(b.commission_date).getTime() - new Date(a.commission_date).getTime());

    return {
      stats: {
        totalRevenue,
        totalCommissions,
        totalSales,
        averageTicket
      },
      barberRankings,
      commissions
    };
  }, [filters]);

  // Buscar dados com cache inteligente
  const fetchData = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    // Tentar buscar do cache primeiro
    const cached = intelligentCache.getIntelligent<ConsolidatedFinancialData>(cacheKey);
    
    if (cached.data && cached.fromCache) {
      setData(cached.data);
      setFromCache(true);
      setLoading(false);
      console.log(`💨 Dados financeiros carregados do cache: ${cacheKey}`);
      return;
    }

    // Se não está no cache, buscar do banco
    setFromCache(false);
    setLoading(true);

    const circuitKey = `intelligent-financial-consolidated-${filters.barbershop_id}`;
    if (!globalState.checkCircuitBreaker(circuitKey, 2, 10000)) {
      setLoading(false);
      return;
    }

    try {
      const consolidatedData = await fetchConsolidatedFinancialData();
      
      // Salvar no cache com triggers de invalidação
      intelligentCache.setWithInvalidation(
        cacheKey,
        consolidatedData,
        300000, // 5 minutos
        ['financial-stats', 'barber-rankings', 'commissions', 'commands', 'command_items'],
        filters.barbershop_id
      );

      setData(consolidatedData);
      console.log(`🔥 Dados financeiros atualizados e cacheados: ${cacheKey}`);
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, cacheKey, fetchConsolidatedFinancialData, filters.barbershop_id]);

  // Função para forçar atualização
  const refetch = useCallback(() => {
    // Invalidar cache específico
    intelligentCache.invalidateByTrigger('financial-stats', filters.barbershop_id);
    intelligentCache.invalidateByTrigger('barber-rankings', filters.barbershop_id);
    intelligentCache.invalidateByTrigger('commissions', filters.barbershop_id);
    
    // Buscar novamente
    fetchData();
  }, [fetchData, filters.barbershop_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats: data.stats,
    barberRankings: data.barberRankings,
    commissions: data.commissions,
    loading,
    fromCache,
    refetch,
  };
}