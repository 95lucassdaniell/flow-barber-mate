import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

export interface ProductRanking {
  id: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
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

export function useFinancialData(
  startDate?: string,
  endDate?: string,
  barberId?: string
) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalCommissions: 0,
    totalSales: 0,
    averageTicket: 0,
  });
  const [barberRankings, setBarberRankings] = useState<BarberRanking[]>([]);
  const [productRankings, setProductRankings] = useState<ProductRanking[]>([]);
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug logs para os filtros
  console.log('useFinancialData - Filters:', { startDate, endDate, barberId });

  const fetchFinancialStats = async () => {
    if (!profile?.barbershop_id) {
      console.log('useFinancialData: No barbershop_id found');
      return;
    }

    console.log('useFinancialData: Fetching stats for barbershop:', profile.barbershop_id);
    console.log('useFinancialData: Filters applied - startDate:', startDate, 'endDate:', endDate, 'barberId:', barberId);
    
    try {
      // Buscar vendas primeiro com filtros aplicados
      let salesQuery = supabase
        .from('sales')
        .select('id, final_amount, sale_date, barber_id')
        .eq('barbershop_id', profile.barbershop_id);

      if (startDate) salesQuery = salesQuery.gte('sale_date', startDate);
      if (endDate) salesQuery = salesQuery.lte('sale_date', endDate);
      if (barberId) salesQuery = salesQuery.eq('barber_id', barberId);

      const { data: sales, error: salesError } = await salesQuery;
      
      if (salesError) {
        console.error('Error fetching sales for stats:', salesError);
        return;
      }
      
      console.log('useFinancialData: Sales found for stats:', sales?.length || 0);

      // Se há vendas, buscar sale_items usando os IDs das vendas
      let totalCommissions = 0;
      if (sales && sales.length > 0) {
        const saleIds = sales.map(sale => sale.id);
        
        const { data: saleItems, error: saleItemsError } = await supabase
          .from('sale_items')
          .select('commission_amount')
          .in('sale_id', saleIds);
        
        if (saleItemsError) {
          console.error('Error fetching sale items for stats:', saleItemsError);
        } else {
          console.log('useFinancialData: Sale items found for stats:', saleItems?.length || 0);
          totalCommissions = saleItems?.reduce((sum, item) => sum + Number(item.commission_amount), 0) || 0;
        }
      }

      const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.final_amount), 0) || 0;
      const totalSales = sales?.length || 0;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

      console.log('useFinancialData: Calculated stats:', { totalRevenue, totalCommissions, totalSales, averageTicket });

      setStats({
        totalRevenue,
        totalCommissions,
        totalSales,
        averageTicket,
      });
    } catch (error) {
      console.error('Error fetching financial stats:', error);
    }
  };

  const fetchBarberRankings = async () => {
    if (!profile?.barbershop_id) return;

    console.log('useFinancialData: Fetching barber rankings for barbershop:', profile.barbershop_id);
    console.log('useFinancialData: Rankings filters - startDate:', startDate, 'endDate:', endDate, 'barberId:', barberId);
    
    try {
      // Buscar vendas primeiro
      let salesQuery = supabase
        .from('sales')
        .select('id, barber_id, sale_date, final_amount')
        .eq('barbershop_id', profile.barbershop_id);

      if (startDate) salesQuery = salesQuery.gte('sale_date', startDate);
      if (endDate) salesQuery = salesQuery.lte('sale_date', endDate);
      if (barberId) salesQuery = salesQuery.eq('barber_id', barberId);

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        return;
      }

      console.log('useFinancialData: Sales data found:', salesData?.length || 0);

      if (!salesData || salesData.length === 0) {
        console.log('useFinancialData: No sales found for rankings');
        setBarberRankings([]);
        return;
      }

      // Buscar sale_items para essas vendas
      const saleIds = salesData.map(sale => sale.id);
      
      const { data: saleItemsData, error: saleItemsError } = await supabase
        .from('sale_items')
        .select('sale_id, commission_amount')
        .in('sale_id', saleIds);

      if (saleItemsError) {
        console.error('Error fetching sale items:', saleItemsError);
        return;
      }

      console.log('useFinancialData: Sale items data:', saleItemsData);

      // Buscar perfis dos barbeiros
      const barberIds = [...new Set(salesData.map(sale => sale.barber_id))];
      console.log('useFinancialData: Barber IDs:', barberIds);

      const { data: barbersData, error: barbersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', barberIds);

      if (barbersError) {
        console.error('Error fetching barbers:', barbersError);
        return;
      }

      console.log('useFinancialData: Barbers data:', barbersData);

      // Criar mapa de barbeiros
      const barbersMap = barbersData?.reduce((acc: any, barber: any) => {
        acc[barber.id] = barber;
        return acc;
      }, {}) || {};

      // Criar mapa de comissões por venda
      const commissionsMap = saleItemsData?.reduce((acc: any, item: any) => {
        if (!acc[item.sale_id]) {
          acc[item.sale_id] = 0;
        }
        acc[item.sale_id] += Number(item.commission_amount) || 0;
        return acc;
      }, {}) || {};

      // Processar os dados para criar o ranking
      const barberStats = salesData.reduce((acc, sale) => {
        const barberId = sale.barber_id;
        const barber = barbersMap[barberId];
        const commissionAmount = commissionsMap[sale.id] || 0;
        
        if (!barber) {
          console.warn('useFinancialData: Barber not found for ID:', barberId);
          return acc;
        }
        
        if (!acc[barberId]) {
          acc[barberId] = {
            id: barberId,
            full_name: barber.full_name,
            totalCommissions: 0,
            totalSales: 0,
            salesCount: 0,
          };
        }
        
        acc[barberId].totalCommissions += commissionAmount;
        acc[barberId].salesCount += 1;
        acc[barberId].totalSales += Number(sale.final_amount) || 0; // Usar o valor real da venda
        return acc;
      }, {} as Record<string, BarberRanking>);

      console.log('useFinancialData: Barber stats:', barberStats);

      const rankings = Object.values(barberStats)
        .sort((a, b) => b.totalCommissions - a.totalCommissions);

      console.log('useFinancialData: Final rankings:', rankings);
      setBarberRankings(rankings);
    } catch (error) {
      console.error('Error fetching barber rankings:', error);
    }
  };

  const fetchCommissions = async () => {
    if (!profile?.barbershop_id) return;

    try {
      let query = supabase
        .from('sale_items')
        .select(`
          id,
          commission_amount,
          sales!inner(
            id,
            sale_date,
            final_amount,
            barbershop_id,
            barber_id,
            profiles!inner(full_name),
            clients!inner(name)
          )
        `)
        .eq('sales.barbershop_id', profile.barbershop_id)
        .order('sales.sale_date', { ascending: false });

      if (startDate) query = query.gte('sales.sale_date', startDate);
      if (endDate) query = query.lte('sales.sale_date', endDate);
      if (barberId) query = query.eq('sales.barber_id', barberId);

      const { data } = await query;
      
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        commission_amount: item.commission_amount,
        commission_date: item.sales.sale_date,
        sale_id: item.sales.id,
        barber: { full_name: item.sales.profiles.full_name },
        sale: {
          final_amount: item.sales.final_amount,
          client: { name: item.sales.clients.name }
        }
      })) || [];

      setCommissions(formattedData);
    } catch (error) {
      console.error('Error fetching commissions:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFinancialStats(),
        fetchBarberRankings(),
        fetchCommissions(),
      ]);
      setLoading(false);
    };

    if (profile?.barbershop_id) {
      fetchData();
    }
  }, [profile?.barbershop_id, startDate, endDate, barberId]);

  return {
    stats,
    barberRankings,
    productRankings,
    commissions,
    loading,
    refetch: () => {
      fetchFinancialStats();
      fetchBarberRankings();
      fetchCommissions();
    },
  };
}