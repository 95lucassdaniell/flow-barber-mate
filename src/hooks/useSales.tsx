import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface SaleItem {
  id: string;
  sale_id: string;
  item_type: 'service' | 'product';
  service_id?: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_rate: number;
  commission_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  barbershop_id: string;
  client_id: string;
  barber_id: string;
  sale_date: string;
  sale_time: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  payment_status: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  sale_items?: SaleItem[];
}

export interface SaleFormData {
  client_id: string;
  barber_id: string;
  items: {
    item_type: 'service' | 'product';
    service_id?: string;
    product_id?: string;
    quantity: number;
    unit_price: number;
    commission_rate: number;
  }[];
  discount_amount: number;
  payment_method: 'cash' | 'card' | 'pix' | 'multiple';
  notes?: string;
}

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchSales = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar vendas:', error);
        toast({
          title: "Erro ao carregar vendas",
          description: "Ocorreu um erro ao buscar as vendas.",
          variant: "destructive",
        });
        return;
      }

      setSales(data as Sale[] || []);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      toast({
        title: "Erro ao carregar vendas",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData: SaleFormData): Promise<string | null> => {
    if (!profile?.barbershop_id || !profile?.id) return null;

    try {
      // Calcular totais
      const totalAmount = saleData.items.reduce((sum, item) => 
        sum + (item.unit_price * item.quantity), 0
      );
      const finalAmount = totalAmount - saleData.discount_amount;

      // Criar a venda
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            barbershop_id: profile.barbershop_id,
            client_id: saleData.client_id,
            barber_id: saleData.barber_id,
            total_amount: totalAmount,
            discount_amount: saleData.discount_amount,
            final_amount: finalAmount,
            payment_method: saleData.payment_method,
            notes: saleData.notes,
            created_by: profile.id,
          }
        ])
        .select()
        .single();

      if (saleError) {
        console.error('Erro ao criar venda:', saleError);
        toast({
          title: "Erro ao criar venda",
          description: saleError.message,
          variant: "destructive",
        });
        return null;
      }

      // Criar itens da venda
      const saleItems = saleData.items.map(item => ({
        sale_id: sale.id,
        item_type: item.item_type,
        service_id: item.service_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        commission_rate: item.commission_rate,
        commission_amount: (item.unit_price * item.quantity) * (item.commission_rate / 100),
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('Erro ao criar itens da venda:', itemsError);
        // Rollback da venda se houver erro nos itens
        await supabase.from('sales').delete().eq('id', sale.id);
        toast({
          title: "Erro ao criar itens da venda",
          description: itemsError.message,
          variant: "destructive",
        });
        return null;
      }

      // Criar comissões
      const commissions = saleItems.map(item => ({
        barbershop_id: profile.barbershop_id,
        barber_id: saleData.barber_id,
        sale_id: sale.id,
        sale_item_id: item.sale_id, // Será atualizado com o ID real
        commission_type: item.item_type,
        base_amount: item.total_price,
        commission_rate: item.commission_rate,
        commission_amount: item.commission_amount,
      }));

      const { error: commissionsError } = await supabase
        .from('commissions')
        .insert(commissions);

      if (commissionsError) {
        console.error('Erro ao criar comissões:', commissionsError);
        // Não fazer rollback para comissões, apenas logar o erro
      }

      // Atualizar estoque para produtos
      for (const item of saleData.items) {
        if (item.item_type === 'product' && item.product_id) {
          // Atualizar estoque manualmente
          const { data: product } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const newStock = product.stock_quantity - item.quantity;
            await supabase
              .from('products')
              .update({ stock_quantity: Math.max(0, newStock) })
              .eq('id', item.product_id);
          }
        }
      }

      await fetchSales();
      
      toast({
        title: "Venda criada com sucesso",
        description: `Venda #${sale.id.slice(0, 8)} foi registrada.`,
      });

      return sale.id;
    } catch (error: any) {
      console.error('Erro ao criar venda:', error);
      toast({
        title: "Erro ao criar venda",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return null;
    }
  };

  const getSalesByDate = (date: string) => {
    return sales.filter(sale => sale.sale_date === date);
  };

  const getSalesByBarber = (barberId: string) => {
    return sales.filter(sale => sale.barber_id === barberId);
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = getSalesByDate(today);
    
    return {
      totalSales: todaySales.length,
      totalRevenue: todaySales.reduce((sum, sale) => sum + sale.final_amount, 0),
      totalCommissions: todaySales.reduce((sum, sale) => 
        sum + (sale.sale_items?.reduce((itemSum, item) => 
          itemSum + item.commission_amount, 0) || 0), 0
      ),
    };
  };

  useEffect(() => {
    fetchSales();
  }, [profile?.barbershop_id]);

  return {
    sales,
    loading,
    createSale,
    getSalesByDate,
    getSalesByBarber,
    getTodayStats,
    refetchSales: fetchSales,
  };
};