import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { intelligentCache, globalState } from "@/lib/globalState";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  due_date: string;
  payment_status: 'pending' | 'paid';
  payment_date?: string;
  notes?: string;
  barbershop_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
}

export const useIntelligentExpenseData = (filters?: ExpenseFilters) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Debounce dos filtros
  const debouncedStartDate = useDebouncedValue(filters?.startDate, 300);
  const debouncedEndDate = useDebouncedValue(filters?.endDate, 300);
  const debouncedCategory = useDebouncedValue(filters?.category, 300);
  const debouncedStatus = useDebouncedValue(filters?.status, 300);

  // Memoizar filtros para cache key
  const memoizedFilters = useMemo(() => ({
    barbershop_id: profile?.barbershop_id,
    startDate: debouncedStartDate,
    endDate: debouncedEndDate,
    category: debouncedCategory,
    status: debouncedStatus
  }), [
    profile?.barbershop_id,
    debouncedStartDate,
    debouncedEndDate,
    debouncedCategory,
    debouncedStatus
  ]);

  // Gerar cache key única
  const cacheKey = useMemo(() => {
    const filterKey = `${memoizedFilters.startDate || 'all'}-${memoizedFilters.endDate || 'all'}-${memoizedFilters.category || 'all'}-${memoizedFilters.status || 'all'}`;
    return `expense-data-${memoizedFilters.barbershop_id}-${filterKey}`;
  }, [memoizedFilters]);

  const shouldFetch = useMemo(() => {
    return Boolean(memoizedFilters.barbershop_id) && 
           globalState.checkRateLimit(`intelligent-expense-${memoizedFilters.barbershop_id}`, 3, 2000);
  }, [memoizedFilters.barbershop_id]);

  // Função otimizada para buscar despesas
  const fetchExpenseData = useCallback(async (): Promise<Expense[]> => {
    if (!memoizedFilters.barbershop_id) {
      throw new Error('Barbershop ID não encontrado');
    }

    let query = supabase
      .from('expenses')
      .select('*')
      .eq('barbershop_id', memoizedFilters.barbershop_id)
      .order('due_date', { ascending: false });

    // Aplicar filtros
    if (memoizedFilters.startDate) {
      query = query.gte('due_date', memoizedFilters.startDate);
    }
    if (memoizedFilters.endDate) {
      query = query.lte('due_date', memoizedFilters.endDate);
    }
    if (memoizedFilters.category && memoizedFilters.category !== 'all') {
      query = query.eq('category', memoizedFilters.category);
    }
    if (memoizedFilters.status && memoizedFilters.status !== 'all') {
      query = query.eq('payment_status', memoizedFilters.status);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('fetchExpenseData error:', error);
      throw error;
    }

    return (data || []) as Expense[];
  }, [memoizedFilters]);

  // Buscar dados com cache inteligente
  const fetchData = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    // Tentar buscar do cache primeiro
    const cached = intelligentCache.getIntelligent<Expense[]>(cacheKey);
    
    if (cached.data && cached.fromCache) {
      setExpenses(cached.data);
      setFromCache(true);
      setLoading(false);
      console.log(`💨 Dados de despesas carregados do cache: ${cacheKey}`);
      return;
    }

    // Se não está no cache, buscar do banco
    setFromCache(false);
    setLoading(true);

    const circuitKey = `intelligent-expense-${memoizedFilters.barbershop_id}`;
    if (!globalState.checkCircuitBreaker(circuitKey, 3, 5000)) {
      setLoading(false);
      return;
    }

    try {
      const expenseData = await fetchExpenseData();
      
      // Salvar no cache com triggers de invalidação
      intelligentCache.setWithInvalidation(
        cacheKey,
        expenseData,
        600000, // 10 minutos
        ['expense-data', 'expenses'],
        memoizedFilters.barbershop_id
      );

      setExpenses(expenseData);
      console.log(`🔥 Dados de despesas atualizados e cacheados: ${cacheKey}`);
    } catch (error) {
      console.error('Erro ao buscar dados de despesas:', error);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, cacheKey, fetchExpenseData, memoizedFilters.barbershop_id]);

  // Criar despesa com invalidação de cache
  const createExpense = useCallback(async (
    expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'barbershop_id' | 'created_by'>
  ) => {
    if (!profile?.barbershop_id || !profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          barbershop_id: profile.barbershop_id,
          created_by: profile.user_id
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidar cache automaticamente
      intelligentCache.invalidateByTrigger('expense-data', profile.barbershop_id);
      intelligentCache.invalidateByTrigger('expenses', profile.barbershop_id);

      toast({
        title: "Sucesso",
        description: "Despesa criada com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar despesa",
        variant: "destructive",
      });
      throw error;
    }
  }, [profile, toast]);

  // Atualizar despesa com invalidação de cache
  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Invalidar cache automaticamente
      intelligentCache.invalidateByTrigger('expense-data', profile?.barbershop_id);
      intelligentCache.invalidateByTrigger('expenses', profile?.barbershop_id);

      toast({
        title: "Sucesso",
        description: "Despesa atualizada com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar despesa",
        variant: "destructive",
      });
      throw error;
    }
  }, [profile?.barbershop_id, toast]);

  // Deletar despesa com invalidação de cache
  const deleteExpense = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalidar cache automaticamente
      intelligentCache.invalidateByTrigger('expense-data', profile?.barbershop_id);
      intelligentCache.invalidateByTrigger('expenses', profile?.barbershop_id);

      toast({
        title: "Sucesso",
        description: "Despesa excluída com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir despesa",
        variant: "destructive",
      });
      throw error;
    }
  }, [profile?.barbershop_id, toast]);

  // Marcar como pago com invalidação de cache
  const markAsPaid = useCallback(async (id: string, paymentDate?: string) => {
    return updateExpense(id, {
      payment_status: 'paid',
      payment_date: paymentDate || new Date().toISOString().split('T')[0]
    });
  }, [updateExpense]);

  // Função para forçar atualização
  const refetch = useCallback(() => {
    intelligentCache.invalidateByTrigger('expense-data', memoizedFilters.barbershop_id);
    fetchData();
  }, [fetchData, memoizedFilters.barbershop_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    expenses,
    loading,
    fromCache,
    refetch,
    createExpense,
    updateExpense,
    deleteExpense,
    markAsPaid,
  };
};