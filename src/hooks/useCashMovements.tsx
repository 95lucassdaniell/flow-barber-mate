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
  created_by: string;
  created_at: string;
  created_by_profile?: {
    full_name: string;
  };
}

export interface CreateMovementData {
  type: 'entry' | 'exit';
  description: string;
  amount: number;
  notes?: string;
}

export const useCashMovements = () => {
  const [movements, setMovements] = useState<CashMovement[]>([]);
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
      
      const { data, error } = await supabase
        .from('cash_movements')
        .select(`
          *,
          created_by_profile:profiles!cash_movements_created_by_fkey(full_name)
        `)
        .eq('cash_register_id', currentCashRegister.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
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
          created_by: profile.id,
        });

      if (error) throw error;

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return movements.filter(movement => {
      const movementDate = new Date(movement.created_at);
      movementDate.setHours(0, 0, 0, 0);
      return movementDate.getTime() === today.getTime();
    });
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
          event: 'INSERT',
          schema: 'public',
          table: 'cash_movements',
          filter: `cash_register_id=eq.${currentCashRegister.id}`
        },
        (payload) => {
          console.log('Nova movimentação:', payload);
          fetchMovements();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cash_movements',
          filter: `cash_register_id=eq.${currentCashRegister.id}`
        },
        (payload) => {
          console.log('Movimentação atualizada:', payload);
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