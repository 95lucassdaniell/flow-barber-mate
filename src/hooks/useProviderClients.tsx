import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProviderAuth } from './useProviderAuth';
import { useToast } from './use-toast';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  notes?: string;
  barbershop_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderClientStats {
  totalClientsServed: number;
  totalAppointments: number;
  averageTicket: number;
  lastAppointmentDate?: Date;
  favoriteServices: string[];
  totalRevenue: number;
}

export const useProviderClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProviderAuth();
  const { toast } = useToast();

  const fetchProviderClients = async () => {
    if (!profile?.barbershop_id || !profile?.id) return;

    try {
      setLoading(true);
      
      // Buscar clientes que já foram atendidos pelo prestador
      const { data: appointmentClients, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          client_id,
          clients!inner(*)
        `)
        .eq('barbershop_id', profile.barbershop_id)
        .eq('barber_id', profile.id)
        .eq('status', 'completed');

      if (appointmentError) {
        console.error('Erro ao buscar clientes do prestador:', appointmentError);
        toast({
          title: "Erro ao carregar clientes",
          description: "Ocorreu um erro ao buscar os clientes atendidos.",
          variant: "destructive",
        });
        return;
      }

      // Extrair clientes únicos
      const uniqueClients = appointmentClients?.reduce((acc, item) => {
        const client = item.clients;
        if (!acc.some(c => c.id === client.id)) {
          acc.push(client);
        }
        return acc;
      }, [] as Client[]) || [];

      // Ordenar por nome
      uniqueClients.sort((a, b) => a.name.localeCompare(b.name));

      setClients(uniqueClients);
    } catch (error) {
      console.error('Erro ao buscar clientes do prestador:', error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProviderClientStats = async (clientId: string): Promise<ProviderClientStats | null> => {
    if (!profile?.id || !profile?.barbershop_id) return null;

    try {
      // Buscar agendamentos do cliente com este prestador
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          total_price,
          status,
          services(name)
        `)
        .eq('client_id', clientId)
        .eq('barber_id', profile.id)
        .eq('barbershop_id', profile.barbershop_id)
        .order('appointment_date', { ascending: false });

      if (appointmentsError) {
        console.error('Erro ao buscar agendamentos do cliente:', appointmentsError);
        return null;
      }

      const completedAppointments = appointments?.filter(apt => apt.status === 'completed') || [];
      
      const totalAppointments = appointments?.length || 0;
      const totalRevenue = completedAppointments.reduce((sum, apt) => sum + Number(apt.total_price), 0);
      const averageTicket = totalAppointments > 0 ? totalRevenue / completedAppointments.length : 0;

      // Serviços favoritos
      const serviceCounts: { [key: string]: number } = {};
      completedAppointments.forEach(apt => {
        if (apt.services?.name) {
          serviceCounts[apt.services.name] = (serviceCounts[apt.services.name] || 0) + 1;
        }
      });

      const favoriteServices = Object.entries(serviceCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([service]) => service);

      const lastAppointmentDate = appointments && appointments.length > 0 
        ? new Date(appointments[0].appointment_date) 
        : undefined;

      return {
        totalClientsServed: 1, // Este cliente específico
        totalAppointments,
        averageTicket,
        lastAppointmentDate,
        favoriteServices,
        totalRevenue
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas do cliente:', error);
      return null;
    }
  };

  const getTotalProviderStats = async (): Promise<Partial<ProviderClientStats>> => {
    if (!profile?.id || !profile?.barbershop_id) return {};

    try {
      // Total de clientes únicos atendidos
      const { data: uniqueClients, error: clientsError } = await supabase
        .from('appointments')
        .select('client_id')
        .eq('barber_id', profile.id)
        .eq('barbershop_id', profile.barbershop_id)
        .eq('status', 'completed');

      if (clientsError) {
        console.error('Erro ao contar clientes únicos:', clientsError);
        return {};
      }

      const totalClientsServed = new Set(uniqueClients?.map(c => c.client_id)).size || 0;

      // Total de agendamentos e receita
      const { data: allAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('total_price')
        .eq('barber_id', profile.id)
        .eq('barbershop_id', profile.barbershop_id)
        .eq('status', 'completed');

      if (appointmentsError) {
        console.error('Erro ao buscar total de agendamentos:', appointmentsError);
        return { totalClientsServed };
      }

      const totalAppointments = allAppointments?.length || 0;
      const totalRevenue = allAppointments?.reduce((sum, apt) => sum + Number(apt.total_price), 0) || 0;
      const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

      return {
        totalClientsServed,
        totalAppointments,
        totalRevenue,
        averageTicket
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas totais:', error);
      return {};
    }
  };

  useEffect(() => {
    fetchProviderClients();
  }, [profile?.barbershop_id, profile?.id]);

  return {
    clients,
    loading,
    refetchClients: fetchProviderClients,
    getProviderClientStats,
    getTotalProviderStats,
  };
};