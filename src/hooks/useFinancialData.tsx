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
    if (!profile?.barbershop_id) return;

    try {
      let query = supabase
        .from('sales')
        .select('final_amount, sale_date')
        .eq('barbershop_id', profile.barbershop_id);

      if (startDate) query = query.gte('sale_date', startDate);
      if (endDate) query = query.lte('sale_date', endDate);
      if (barberId) query = query.eq('barber_id', barberId);

      const { data: sales } = await query;

      let commissionsQuery = supabase
        .from('commissions')
        .select('commission_amount, commission_date')
        .eq('barbershop_id', profile.barbershop_id);

      if (startDate) commissionsQuery = commissionsQuery.gte('commission_date', startDate);
      if (endDate) commissionsQuery = commissionsQuery.lte('commission_date', endDate);
      if (barberId) commissionsQuery = commissionsQuery.eq('barber_id', barberId);

      const { data: commissionsData } = await commissionsQuery;

      const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.final_amount), 0) || 0;
      const totalCommissions = commissionsData?.reduce((sum, comm) => sum + Number(comm.commission_amount), 0) || 0;
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
      const { data: commissionsData } = await supabase
        .from('commissions')
        .select(`
          barbershop_id,
          barber_id,
          commission_amount,
          commission_date,
          profiles!inner(full_name)
        `)
        .eq('barbershop_id', profile.barbershop_id)
        .gte('commission_date', startDate || '1900-01-01')
        .lte('commission_date', endDate || '2100-12-31');

      const barberStats = commissionsData?.reduce((acc, comm: any) => {
        const barberId = comm.barber_id;
        if (!acc[barberId]) {
          acc[barberId] = {
            id: barberId,
            full_name: comm.profiles.full_name,
            totalCommissions: 0,
            totalSales: 0,
            salesCount: 0,
          };
        }
        acc[barberId].totalCommissions += Number(comm.commission_amount);
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
        .from('commissions')
        .select(`
          id,
          commission_amount,
          commission_date,
          sale_id,
          profiles!inner(full_name),
          sales!inner(
            final_amount,
            clients!inner(name)
          )
        `)
        .eq('barbershop_id', profile.barbershop_id)
        .order('commission_date', { ascending: false });

      if (startDate) query = query.gte('commission_date', startDate);
      if (endDate) query = query.lte('commission_date', endDate);
      if (barberId) query = query.eq('barber_id', barberId);

      const { data } = await query;
      
      const formattedData = data?.map((item: any) => ({
        id: item.id,
        commission_amount: item.commission_amount,
        commission_date: item.commission_date,
        sale_id: item.sale_id,
        barber: { full_name: item.profiles.full_name },
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