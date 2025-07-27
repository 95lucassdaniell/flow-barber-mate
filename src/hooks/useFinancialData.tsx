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

  const fetchFinancialStats = async () => {
    if (!profile?.barbershop_id) {
      console.log('useFinancialData: No barbershop_id found');
      return;
    }

    console.log('useFinancialData: Fetching stats for barbershop:', profile.barbershop_id);
    try {
      let salesQuery = supabase
        .from('sales')
        .select('final_amount, sale_date')
        .eq('barbershop_id', profile.barbershop_id);

      if (startDate) salesQuery = salesQuery.gte('sale_date', startDate);
      if (endDate) salesQuery = salesQuery.lte('sale_date', endDate);
      if (barberId) salesQuery = salesQuery.eq('barber_id', barberId);

      const { data: sales } = await salesQuery;

      // Buscar comissões dos sale_items
      let saleItemsQuery = supabase
        .from('sale_items')
        .select(`
          commission_amount,
          sales!inner(sale_date, barbershop_id, barber_id)
        `)
        .eq('sales.barbershop_id', profile.barbershop_id);

      if (startDate) saleItemsQuery = saleItemsQuery.gte('sales.sale_date', startDate);
      if (endDate) saleItemsQuery = saleItemsQuery.lte('sales.sale_date', endDate);
      if (barberId) saleItemsQuery = saleItemsQuery.eq('sales.barber_id', barberId);

      const { data: saleItems } = await saleItemsQuery;

      const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.final_amount), 0) || 0;
      const totalCommissions = saleItems?.reduce((sum, item) => sum + Number(item.commission_amount), 0) || 0;
      const totalSales = sales?.length || 0;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

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

    try {
      let saleItemsQuery = supabase
        .from('sale_items')
        .select(`
          commission_amount,
          sales!inner(
            barbershop_id,
            barber_id,
            sale_date,
            profiles!inner(id, full_name)
          )
        `)
        .eq('sales.barbershop_id', profile.barbershop_id);

      if (startDate) saleItemsQuery = saleItemsQuery.gte('sales.sale_date', startDate);
      if (endDate) saleItemsQuery = saleItemsQuery.lte('sales.sale_date', endDate);

      const { data: saleItemsData } = await saleItemsQuery;

      const barberStats = saleItemsData?.reduce((acc, item: any) => {
        const barberId = item.sales.barber_id;
        const barberProfile = item.sales.profiles;
        
        if (!acc[barberId]) {
          acc[barberId] = {
            id: barberId,
            full_name: barberProfile.full_name,
            totalCommissions: 0,
            totalSales: 0,
            salesCount: 0,
          };
        }
        acc[barberId].totalCommissions += Number(item.commission_amount);
        acc[barberId].salesCount += 1;
        return acc;
      }, {} as Record<string, BarberRanking>) || {};

      const rankings = Object.values(barberStats)
        .sort((a, b) => b.totalCommissions - a.totalCommissions);

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