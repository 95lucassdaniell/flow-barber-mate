import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CashRegister {
  id: string;
  user_id: string;
  barbershop_id: string;
  opened_at: string;
  closed_at?: string;
  opening_balance: number;
  closing_balance?: number;
  total_sales: number;
  total_cash: number;
  total_card: number;
  total_pix: number;
  total_multiple: number;
  sales_count: number;
  status: 'open' | 'closed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CashRegisterItem {
  id: string;
  cash_register_id: string;
  item_type: 'service' | 'product';
  service_id?: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  commission_rate: number;
  client_id?: string;
  barber_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CashRegisterSummary {
  totalSales: number;
  totalRevenue: number;
  salesByPaymentMethod: {
    cash: number;
    card: number;
    pix: number;
    multiple: number;
  };
  salesCount: number;
  totalCommissions: number;
}

export const useCashRegister = () => {
  const [currentCashRegister, setCurrentCashRegister] = useState<CashRegister | null>(null);
  const [cartItems, setCartItems] = useState<CashRegisterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Verificar e abrir caixa automaticamente
  const initializeCashRegister = async () => {
    if (!profile?.id || !profile?.barbershop_id) return;

    try {
      setLoading(true);
      
      // Verificar se já existe um caixa aberto
      const { data: existingCash, error: fetchError } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('user_id', profile.id)
        .eq('barbershop_id', profile.barbershop_id)
        .eq('status', 'open')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao verificar caixa:', fetchError);
        return;
      }

      if (existingCash) {
        setCurrentCashRegister(existingCash as CashRegister);
        await loadCartItems(existingCash.id);
      } else {
        // Criar novo caixa
        await openCashRegister();
      }
    } catch (error) {
      console.error('Erro ao inicializar caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  // Abrir novo caixa
  const openCashRegister = async (openingBalance: number = 0): Promise<string | null> => {
    if (!profile?.id || !profile?.barbershop_id) return null;

    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .insert([
          {
            user_id: profile.id,
            barbershop_id: profile.barbershop_id,
            opening_balance: openingBalance,
            status: 'open'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao abrir caixa:', error);
        toast({
          title: "Erro ao abrir caixa",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      setCurrentCashRegister(data as CashRegister);
      toast({
        title: "Caixa aberto",
        description: "Caixa aberto com sucesso!",
      });

      return data.id;
    } catch (error: any) {
      console.error('Erro ao abrir caixa:', error);
      toast({
        title: "Erro ao abrir caixa",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Fechar caixa
  const closeCashRegister = async (closingBalance: number, notes?: string): Promise<boolean> => {
    if (!currentCashRegister) return false;

    try {
      const { error } = await supabase
        .from('cash_registers')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closing_balance: closingBalance,
          notes: notes
        })
        .eq('id', currentCashRegister.id);

      if (error) {
        console.error('Erro ao fechar caixa:', error);
        toast({
          title: "Erro ao fechar caixa",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Limpar itens do carrinho
      await clearCartItems();
      
      setCurrentCashRegister(null);
      setCartItems([]);

      toast({
        title: "Caixa fechado",
        description: "Caixa fechado com sucesso!",
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao fechar caixa:', error);
      toast({
        title: "Erro ao fechar caixa",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Carregar itens do carrinho
  const loadCartItems = async (cashRegisterId: string) => {
    try {
      const { data, error } = await supabase
        .from('cash_register_items')
        .select('*')
        .eq('cash_register_id', cashRegisterId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar itens do carrinho:', error);
        return;
      }

      setCartItems((data || []) as CashRegisterItem[]);
    } catch (error) {
      console.error('Erro ao carregar itens do carrinho:', error);
    }
  };

  // Salvar item no carrinho
  const saveCartItem = async (item: Omit<CashRegisterItem, 'id' | 'cash_register_id' | 'created_at' | 'updated_at'>) => {
    if (!currentCashRegister) return null;

    try {
      const { data, error } = await supabase
        .from('cash_register_items')
        .insert([
          {
            ...item,
            cash_register_id: currentCashRegister.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar item:', error);
        return null;
      }

      setCartItems(prev => [...prev, data as CashRegisterItem]);
      return data.id;
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      return null;
    }
  };

  // Remover item do carrinho
  const removeCartItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cash_register_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Erro ao remover item:', error);
        return false;
      }

      setCartItems(prev => prev.filter(item => item.id !== itemId));
      return true;
    } catch (error) {
      console.error('Erro ao remover item:', error);
      return false;
    }
  };

  // Atualizar quantidade do item
  const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      return await removeCartItem(itemId);
    }

    try {
      const { data, error } = await supabase
        .from('cash_register_items')
        .update({ quantity })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar quantidade:', error);
        return false;
      }

      setCartItems(prev => prev.map(item => 
        item.id === itemId ? data as CashRegisterItem : item
      ));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      return false;
    }
  };

  // Limpar todos os itens do carrinho
  const clearCartItems = async () => {
    if (!currentCashRegister) return;

    try {
      const { error } = await supabase
        .from('cash_register_items')
        .delete()
        .eq('cash_register_id', currentCashRegister.id);

      if (error) {
        console.error('Erro ao limpar carrinho:', error);
        return false;
      }

      setCartItems([]);
      return true;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      return false;
    }
  };

  // Atualizar totais do caixa após venda
  const updateCashRegisterTotals = async (saleAmount: number, paymentMethod: string) => {
    if (!currentCashRegister) return;

    try {
      const updates: any = {
        total_sales: currentCashRegister.total_sales + saleAmount,
        sales_count: currentCashRegister.sales_count + 1
      };

      switch (paymentMethod) {
        case 'cash':
          updates.total_cash = currentCashRegister.total_cash + saleAmount;
          break;
        case 'card':
          updates.total_card = currentCashRegister.total_card + saleAmount;
          break;
        case 'pix':
          updates.total_pix = currentCashRegister.total_pix + saleAmount;
          break;
        case 'multiple':
          updates.total_multiple = currentCashRegister.total_multiple + saleAmount;
          break;
      }

      const { data, error } = await supabase
        .from('cash_registers')
        .update(updates)
        .eq('id', currentCashRegister.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar totais:', error);
        return;
      }

      setCurrentCashRegister(data as CashRegister);
    } catch (error) {
      console.error('Erro ao atualizar totais:', error);
    }
  };

  // Obter resumo do caixa
  const getCashRegisterSummary = (): CashRegisterSummary => {
    if (!currentCashRegister) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        salesByPaymentMethod: { cash: 0, card: 0, pix: 0, multiple: 0 },
        salesCount: 0,
        totalCommissions: 0
      };
    }

    return {
      totalSales: currentCashRegister.sales_count,
      totalRevenue: currentCashRegister.total_sales,
      salesByPaymentMethod: {
        cash: currentCashRegister.total_cash,
        card: currentCashRegister.total_card,
        pix: currentCashRegister.total_pix,
        multiple: currentCashRegister.total_multiple
      },
      salesCount: currentCashRegister.sales_count,
      totalCommissions: 0 // Será calculado separadamente
    };
  };

  useEffect(() => {
    if (profile?.id && profile?.barbershop_id) {
      initializeCashRegister();
    }
  }, [profile?.id, profile?.barbershop_id]);

  return {
    currentCashRegister,
    cartItems,
    loading,
    openCashRegister,
    closeCashRegister,
    saveCartItem,
    removeCartItem,
    updateCartItemQuantity,
    clearCartItems,
    updateCashRegisterTotals,
    getCashRegisterSummary,
    initializeCashRegister
  };
};