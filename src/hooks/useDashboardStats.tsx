import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, isToday } from "date-fns";

interface DashboardStats {
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  todayAppointments: number;
  weekAppointments: number;
  totalClients: number;
  inactiveClients: number;
  messagesThisMonth: number;
  averageTicket: number;
}

interface TodayAppointment {
  time: string;
  client: string;
  service: string;
  barber: string;
  status: string;
  appointmentId: string;
}

export const useDashboardStats = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    monthlyProfit: 0,
    todayAppointments: 0,
    weekAppointments: 0,
    totalClients: 0,
    inactiveClients: 0,
    messagesThisMonth: 0,
    averageTicket: 0,
  });
  const [todaySchedule, setTodaySchedule] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      
      const now = new Date();
      const startMonth = startOfMonth(now);
      const endMonth = endOfMonth(now);
      const startWeek = startOfWeek(now, { weekStartsOn: 1 });
      const endWeek = endOfWeek(now, { weekStartsOn: 1 });
      const today = format(now, 'yyyy-MM-dd');

      // Buscar vendas do mês atual
      const { data: salesData } = await supabase
        .from('sales')
        .select('final_amount, created_at')
        .eq('barbershop_id', profile.barbershop_id)
        .gte('created_at', startMonth.toISOString())
        .lte('created_at', endMonth.toISOString());

      // Buscar agendamentos de hoje
      const { data: todayAppointmentsData } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          status,
          client:clients(name),
          service:services(name),
          barber:profiles(full_name)
        `)
        .eq('barbershop_id', profile.barbershop_id)
        .eq('appointment_date', today)
        .order('start_time');

      // Buscar agendamentos da semana
      const { data: weekAppointmentsData } = await supabase
        .from('appointments')
        .select('id')
        .eq('barbershop_id', profile.barbershop_id)
        .gte('appointment_date', format(startWeek, 'yyyy-MM-dd'))
        .lte('appointment_date', format(endWeek, 'yyyy-MM-dd'));

      // Buscar total de clientes
      const { count: totalClientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('barbershop_id', profile.barbershop_id);

      // Buscar clientes inativos (sem agendamento há mais de 60 dias)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const { data: activeClientsData } = await supabase
        .from('appointments')
        .select('client_id')
        .eq('barbershop_id', profile.barbershop_id)
        .gte('created_at', sixtyDaysAgo.toISOString());

      const { data: allClients } = await supabase
        .from('clients')
        .select('id')
        .eq('barbershop_id', profile.barbershop_id);

      // Calcular clientes ativos únicos
      const activeClientIds = new Set(activeClientsData?.map(a => a.client_id) || []);
      const activeClients = activeClientIds.size;

      // Buscar mensagens WhatsApp do mês
      const { count: messagesCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact' })
        .eq('barbershop_id', profile.barbershop_id)
        .gte('created_at', startMonth.toISOString())
        .lte('created_at', endMonth.toISOString());

      // Calcular estatísticas
      const monthlyRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.final_amount), 0) || 0;
      const averageTicket = salesData?.length ? monthlyRevenue / salesData.length : 0;
      const monthlyExpenses = monthlyRevenue * 0.35; // Estimativa de 35% de custos
      const monthlyProfit = monthlyRevenue - monthlyExpenses;

      // Processar agenda de hoje
      const schedule: TodayAppointment[] = todayAppointmentsData?.map(apt => ({
        time: apt.start_time,
        client: apt.client?.name || '',
        service: apt.service?.name || '',
        barber: apt.barber?.full_name || '',
        status: apt.status,
        appointmentId: apt.id
      })) || [];

      setStats({
        monthlyRevenue,
        monthlyExpenses,
        monthlyProfit,
        todayAppointments: todayAppointmentsData?.length || 0,
        weekAppointments: weekAppointmentsData?.length || 0,
        totalClients: totalClientsCount || 0,
        inactiveClients: Math.max(0, (totalClientsCount || 0) - activeClients),
        messagesThisMonth: messagesCount || 0,
        averageTicket,
      });

      setTodaySchedule(schedule);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [profile?.barbershop_id]);

  return {
    stats,
    todaySchedule,
    loading,
    refetch: fetchDashboardData
  };
};