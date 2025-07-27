import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Expense {
  id: string;
  barbershop_id: string;
  category: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  payment_status: 'pending' | 'paid' | 'overdue';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useExpenses(startDate?: string, endDate?: string, category?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchExpenses = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .order('due_date', { ascending: false });

      if (startDate && endDate) {
        query = query.gte('due_date', startDate).lte('due_date', endDate);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExpenses((data || []) as Expense[]);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar despesas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'barbershop_id' | 'created_by'>) => {
    if (!profile?.barbershop_id || !profile?.id) return null;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          ...expense,
          barbershop_id: profile.barbershop_id,
          created_by: profile.id
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchExpenses();
      toast({
        title: "Sucesso",
        description: "Despesa criada com sucesso",
      });

      return data.id;
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar despesa",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchExpenses();
      toast({
        title: "Sucesso",
        description: "Despesa atualizada com sucesso",
      });

      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar despesa",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchExpenses();
      toast({
        title: "Sucesso",
        description: "Despesa excluída com sucesso",
      });

      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir despesa",
        variant: "destructive",
      });
      return false;
    }
  };

  const markAsPaid = async (id: string, paymentDate: string = new Date().toISOString().split('T')[0]) => {
    return updateExpense(id, {
      payment_status: 'paid',
      payment_date: paymentDate
    });
  };

  useEffect(() => {
    fetchExpenses();
  }, [profile?.barbershop_id, startDate, endDate, category]);

  return {
    expenses,
    loading,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    markAsPaid
  };
}