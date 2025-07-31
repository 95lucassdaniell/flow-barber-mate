import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProviderAuth } from "@/hooks/useProviderAuth";

export interface ProviderCommissionData {
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

export interface ProviderStats {
  totalCommissions: number;
  totalRevenue: number;
  totalSales: number;
  averageTicket: number;
}

export function useProviderCommissions(
  startDate?: string,
  endDate?: string
) {
  const { profile } = useProviderAuth();
  const [stats, setStats] = useState<ProviderStats>({
    totalCommissions: 0,
    totalRevenue: 0,
    totalSales: 0,
    averageTicket: 0,
  });
  const [commissions, setCommissions] = useState<ProviderCommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissions = async () => {
    if (!profile?.id || !profile?.barbershop_id) {
      console.log('useProviderCommissions: No profile or barbershop_id found');
      return;
    }

    setLoading(true);
    setError(null);
    
    console.log('useProviderCommissions: Fetching for provider:', {
      providerId: profile.id,
      barbershopId: profile.barbershop_id,
      startDate,
      endDate
    });

    try {
      // Build query for command items with proper joins
      let query = supabase
        .from('command_items')
        .select(`
          id,
          commission_amount,
          command_id,
          commands!inner(
            id,
            created_at,
            total_amount,
            barber_id,
            client_id,
            status,
            barbershop_id
          )
        `)
        .eq('commands.barbershop_id', profile.barbershop_id)
        .eq('commands.barber_id', profile.id)
        .eq('commands.status', 'closed')
        .gt('commission_amount', 0); // Only include items with commissions

      // Apply date filters
      if (startDate) {
        query = query.gte('commands.created_at', startDate);
      }
      if (endDate) {
        query = query.lte('commands.created_at', endDate + ' 23:59:59');
      }

      const { data: commandItems, error: commandItemsError } = await query;
      
      if (commandItemsError) {
        console.error('Error fetching command items:', commandItemsError);
        setError('Erro ao buscar dados de comissões');
        return;
      }

      console.log('useProviderCommissions: Found command items:', commandItems?.length || 0);

      if (!commandItems || commandItems.length === 0) {
        setCommissions([]);
        setStats({
          totalCommissions: 0,
          totalRevenue: 0,
          totalSales: 0,
          averageTicket: 0,
        });
        return;
      }

      // Get unique command IDs to fetch client data
      const commandIds = [...new Set(commandItems.map(item => item.commands.id))];
      
      // Fetch client data
      const { data: commands, error: commandsError } = await supabase
        .from('commands')
        .select(`
          id,
          clients!commands_client_id_fkey(name)
        `)
        .in('id', commandIds);

      if (commandsError) {
        console.error('Error fetching commands with clients:', commandsError);
        setError('Erro ao buscar dados dos clientes');
        return;
      }

      // Create a map for quick client lookup
      const clientMap = new Map();
      commands?.forEach(command => {
        clientMap.set(command.id, command.clients?.name || 'Cliente não encontrado');
      });

      // Format commission data
      const formattedCommissions: ProviderCommissionData[] = commandItems.map(item => ({
        id: item.id,
        commission_amount: Number(item.commission_amount),
        commission_date: item.commands.created_at.split('T')[0],
        sale_id: item.commands.id,
        barber: {
          full_name: profile.full_name
        },
        sale: {
          client: {
            name: clientMap.get(item.commands.id) || 'Cliente não encontrado'
          },
          final_amount: Number(item.commands.total_amount)
        }
      }));

      // Sort by date (most recent first)
      formattedCommissions.sort((a, b) => 
        new Date(b.commission_date).getTime() - new Date(a.commission_date).getTime()
      );

      // Calculate stats
      const totalCommissions = formattedCommissions.reduce((sum, comm) => sum + comm.commission_amount, 0);
      
      // Get unique commands for calculating revenue and sales count
      const uniqueCommands = new Map();
      commandItems.forEach(item => {
        if (!uniqueCommands.has(item.commands.id)) {
          uniqueCommands.set(item.commands.id, item.commands.total_amount);
        }
      });
      
      const totalRevenue = Array.from(uniqueCommands.values()).reduce((sum, amount) => sum + Number(amount), 0);
      const totalSales = uniqueCommands.size;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

      console.log('useProviderCommissions: Calculated stats:', {
        totalCommissions,
        totalRevenue,
        totalSales,
        averageTicket,
        commissionsCount: formattedCommissions.length
      });

      setCommissions(formattedCommissions);
      setStats({
        totalCommissions,
        totalRevenue,
        totalSales,
        averageTicket,
      });

    } catch (error) {
      console.error('useProviderCommissions: Unexpected error:', error);
      setError('Erro inesperado ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id && profile?.barbershop_id) {
      fetchCommissions();
    }
  }, [profile?.id, profile?.barbershop_id, startDate, endDate]);

  return {
    stats,
    commissions,
    loading,
    error,
    refetch: fetchCommissions,
  };
}