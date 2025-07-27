import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCashRegister } from "@/hooks/useCashRegister";

export interface CashMovement {
  id: string;
  cash_register_id: string;
  type: 'entry' | 'exit';
  description: string;
  amount: number;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface CreateMovementData {
  type: 'entry' | 'exit';
  description: string;
  amount: number;
  notes?: string;
}

export interface CashMovementItem {
  id: string;
  type: 'entry' | 'exit';
  description: string;
  amount: number;
  notes?: string;
  created_at: string;
  source: 'manual' | 'sale' | 'command';
  source_data?: any;
}

export const useCashMovements = () => {
  const [movements, setMovements] = useState<CashMovementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { currentCashRegister } = useCashRegister();

  const fetchMovements = async () => {
    if (!currentCashRegister?.id) {
      setMovements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Buscar movimentações manuais
      const { data: cashMovements, error: cashError } = await supabase
        .from('cash_movements')
        .select(`
          *,
          profiles!created_by(full_name)
        `)
        .eq('cash_register_id', currentCashRegister.id)
        .order('created_at', { ascending: false });

      if (cashError) throw cashError;

      // Buscar vendas
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('cash_register_id', currentCashRegister.id)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Buscar clientes das vendas
      const clientIds = sales?.map(sale => sale.client_id).filter(Boolean) || [];
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);

      // Buscar barbeiros das vendas
      const barberIds = sales?.map(sale => sale.barber_id).filter(Boolean) || [];
      const { data: barbers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', barberIds);

      // Combinar e formatar movimentações
      const allMovements: CashMovementItem[] = [
        // Movimentações manuais
        ...(cashMovements || []).map(movement => ({
          id: movement.id,
          type: movement.type as 'entry' | 'exit',
          description: movement.description,
          amount: movement.amount,
          notes: movement.notes,
          created_at: movement.created_at,
          source: 'manual' as const,
          source_data: movement
        })),
        // Vendas como entradas
        ...(sales || []).map(sale => {
          const client = clients?.find(c => c.id === sale.client_id);
          const barber = barbers?.find(b => b.id === sale.barber_id);
          
          return {
            id: sale.id,
            type: 'entry' as const,
            description: `Venda - ${client?.name || 'Cliente não identificado'}`,
            amount: sale.final_amount,
            notes: `Vendido por: ${barber?.full_name || 'N/A'}`,
            created_at: sale.created_at,
            source: 'sale' as const,
            source_data: sale
          };
        })
      ];

      // Ordenar por data
      allMovements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setMovements(allMovements);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar movimentações do caixa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMovement = async (movementData: CreateMovementData): Promise<boolean> => {
    if (!currentCashRegister?.id || !profile?.id) {
      toast({
        title: "Erro",
        description: "Caixa não está aberto ou usuário não identificado",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('cash_movements')
        .insert({
          cash_register_id: currentCashRegister.id,
          type: movementData.type,
          description: movementData.description,
          amount: movementData.amount,
          notes: movementData.notes,
          created_by: profile.id
        });

      if (error) throw error;

      toast({
        title: "Movimentação registrada",
        description: `${movementData.type === 'entry' ? 'Entrada' : 'Saída'} de R$ ${movementData.amount.toFixed(2)} registrada com sucesso.`,
      });
      
      await fetchMovements();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar movimentação:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar movimentação",
        variant: "destructive",
      });
      return false;
    }
  };

  const getTodayMovements = () => {
    return []; // Temporário - retornar array vazio até implementar corretamente
  };

  useEffect(() => {
    if (currentCashRegister?.id) {
      fetchMovements();
    } else {
      setMovements([]);
      setLoading(false);
    }
  }, [currentCashRegister?.id]);

  // Real-time listeners
  useEffect(() => {
    if (!currentCashRegister?.id) return;

    const channel = supabase
      .channel('cash-movements-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_movements',
          filter: `cash_register_id=eq.${currentCashRegister.id}`
        },
        () => {
          fetchMovements();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `cash_register_id=eq.${currentCashRegister.id}`
        },
        () => {
          fetchMovements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCashRegister?.id]);

  return {
    movements,
    loading,
    addMovement,
    fetchMovements,
    getTodayMovements,
  };
};