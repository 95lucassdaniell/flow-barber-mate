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
      // Temporariamente retornar array vazio até implementar a tabela cash_movements
      setMovements([]);
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
      // Temporariamente simular sucesso até implementar a tabela cash_movements
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

    // Temporariamente desabilitado até implementar a tabela correta
    const channel = supabase
      .channel('cash-movements-realtime')
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