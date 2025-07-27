import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CashRegisterClosure {
  id: string;
  cash_register_id: string;
  closed_by: string;
  opening_balance: number;
  closing_balance: number;
  total_sales: number;
  total_cash: number;
  total_card: number;
  total_pix: number;
  total_multiple: number;
  discrepancy: number;
  notes?: string;
  closed_at: string;
  barbershop_id: string;
}

export function useCashRegisterHistory(startDate?: string, endDate?: string, userId?: string) {
  const [closures, setClosures] = useState<CashRegisterClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchClosures = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      let query = supabase
        .from('cash_register_closures')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .order('closed_at', { ascending: false });

      if (startDate && endDate) {
        query = query.gte('closed_at', startDate).lt('closed_at', endDate + 'T23:59:59');
      }

      if (userId) {
        query = query.eq('closed_by', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClosures((data || []) as CashRegisterClosure[]);
    } catch (error) {
      console.error('Error fetching cash register closures:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de caixa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createClosure = async (cashRegisterId: string, closureData: {
    opening_balance: number;
    closing_balance: number;
    total_sales: number;
    total_cash: number;
    total_card: number;
    total_pix: number;
    total_multiple: number;
    discrepancy: number;
    notes?: string;
  }) => {
    if (!profile?.barbershop_id || !profile?.id) return null;

    try {
      const { data, error } = await supabase
        .from('cash_register_closures')
        .insert([{
          cash_register_id: cashRegisterId,
          closed_by: profile.id,
          barbershop_id: profile.barbershop_id,
          ...closureData
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchClosures();
      toast({
        title: "Sucesso",
        description: "Fechamento de caixa registrado com sucesso",
      });

      return data.id;
    } catch (error) {
      console.error('Error creating cash closure:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar fechamento de caixa",
        variant: "destructive",
      });
      return null;
    }
  };

  const getClosureStats = () => {
    const totalSales = closures.reduce((sum, closure) => sum + Number(closure.total_sales), 0);
    const totalDiscrepancy = closures.reduce((sum, closure) => sum + Number(closure.discrepancy), 0);
    const averageTicket = closures.length > 0 ? totalSales / closures.length : 0;

    const paymentMethodTotals = closures.reduce((acc, closure) => ({
      cash: acc.cash + Number(closure.total_cash),
      card: acc.card + Number(closure.total_card),
      pix: acc.pix + Number(closure.total_pix),
      multiple: acc.multiple + Number(closure.total_multiple)
    }), { cash: 0, card: 0, pix: 0, multiple: 0 });

    return {
      totalSales,
      totalDiscrepancy,
      averageTicket,
      paymentMethodTotals,
      closuresCount: closures.length
    };
  };

  useEffect(() => {
    fetchClosures();
  }, [profile?.barbershop_id, startDate, endDate, userId]);

  return {
    closures,
    loading,
    fetchClosures,
    createClosure,
    getClosureStats
  };
}