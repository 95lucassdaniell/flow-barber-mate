import { useState, useEffect } from 'react';
import { useAppointments } from './useAppointments';
import { useSales } from './useSales';
import { supabase } from '@/integrations/supabase/client';

export interface ClientStats {
  totalSpent: number;
  totalPurchases: number;
  averageTicket: number;
  totalAppointments: number;
  completedAppointments: number;
  lastVisit: Date | null;
  favoriteServices: string[];
  monthlySpending: { month: string; amount: number }[];
  visitFrequency: number; // dias entre visitas
}

export const useClientStats = (clientId: string | null) => {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { getClientAppointments } = useAppointments();
  const { getClientSales } = useSales();

  const calculateStats = async (clientId: string) => {
    setLoading(true);
    try {
      // Para resolver o erro temporariamente, vamos buscar diretamente
      const [appointmentsData, salesData] = await Promise.all([
        supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            start_time,
            end_time,
            total_price,
            status,
            notes,
            services (
              name,
              duration_minutes
            ),
            profiles!barber_id (
              full_name
            )
          `)
          .eq('client_id', clientId)
          .order('appointment_date', { ascending: false }),
        supabase
          .from('sales')
          .select(`
            id,
            sale_date,
            sale_time,
            total_amount,
            final_amount,
            payment_method,
            payment_status
          `)
          .eq('client_id', clientId)
          .order('sale_date', { ascending: false })
      ]);

      const appointments = appointmentsData.data || [];
      const sales = salesData.data || [];

      // Cálculos financeiros
      const totalSpent = sales.reduce((sum, sale) => sum + parseFloat(sale.final_amount.toString()), 0);
      const totalPurchases = sales.length;
      const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

      // Cálculos de agendamentos
      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;

      // Última visita
      const sortedAppointments = appointments
        .filter(apt => apt.status === 'completed')
        .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
      const lastVisit = sortedAppointments[0] ? new Date(sortedAppointments[0].appointment_date) : null;

      // Serviços favoritos
      const serviceCount: { [key: string]: number } = {};
      appointments.forEach(apt => {
        if (apt.services?.name) {
          serviceCount[apt.services.name] = (serviceCount[apt.services.name] || 0) + 1;
        }
      });
      const favoriteServices = Object.entries(serviceCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([service]) => service);

      // Gastos mensais
      const monthlySpending: { [key: string]: number } = {};
      sales.forEach(sale => {
        const month = new Date(sale.sale_date).toISOString().slice(0, 7); // YYYY-MM
        monthlySpending[month] = (monthlySpending[month] || 0) + parseFloat(sale.final_amount.toString());
      });
      const monthlySpendingArray = Object.entries(monthlySpending)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Frequência de visitas (média de dias entre visitas)
      let visitFrequency = 0;
      if (sortedAppointments.length > 1) {
        const intervals = [];
        for (let i = 0; i < sortedAppointments.length - 1; i++) {
          const date1 = new Date(sortedAppointments[i].appointment_date);
          const date2 = new Date(sortedAppointments[i + 1].appointment_date);
          const diffDays = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
          intervals.push(diffDays);
        }
        visitFrequency = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      }

      const calculatedStats: ClientStats = {
        totalSpent,
        totalPurchases,
        averageTicket,
        totalAppointments,
        completedAppointments,
        lastVisit,
        favoriteServices,
        monthlySpending: monthlySpendingArray,
        visitFrequency,
      };

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error calculating client stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      calculateStats(clientId);
    } else {
      setStats(null);
    }
  }, [clientId]);

  return {
    stats,
    loading,
    refreshStats: () => clientId && calculateStats(clientId),
  };
};