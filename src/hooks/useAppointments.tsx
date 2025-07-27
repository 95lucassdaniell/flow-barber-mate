import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Appointment {
  id: string;
  barbershop_id: string;
  client_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  client?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  service?: {
    id: string;
    name: string;
    duration_minutes: number;
  };
  barber?: {
    id: string;
    full_name: string;
  };
}

interface CreateAppointmentData {
  client_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  total_price: number;
  notes?: string;
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  const [lastFetchKey, setLastFetchKey] = useState<string>('');

  const fetchAppointments = async (barberId?: string, date?: string, mode: 'day' | 'week' = 'day') => {
    if (!profile?.barbershop_id) return;

    // Criar chave única para evitar requests duplicadas
    const fetchKey = `${barberId || 'all'}-${date || 'all'}-${mode}-${profile.barbershop_id}`;
    if (fetchKey === lastFetchKey && loading) {
      console.log('⏭️ Pulando request duplicada:', fetchKey);
      return;
    }

    try {
      setLoading(true);
      setLastFetchKey(fetchKey);
      
      console.log('🔄 Buscando agendamentos:', { barberId, date, mode, fetchKey });
      
      // Para modo "day", limpar agendamentos antes da busca
      if (mode === 'day') {
        setAppointments([]);
      }
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients(id, name, phone, email),
          service:services(id, name, duration_minutes),
          barber:profiles!appointments_barber_id_fkey(id, full_name)
        `)
        .eq('barbershop_id', profile.barbershop_id);

      if (barberId) {
        query = query.eq('barber_id', barberId);
      }

      if (date) {
        query = query.eq('appointment_date', date);
      }

      const { data, error } = await query.order('appointment_date', { ascending: true })
                                    .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        toast({
          title: "Erro ao carregar agendamentos",
          description: "Ocorreu um erro ao buscar os agendamentos.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Agendamentos carregados:', data?.length || 0, 'para', { barberId, date, mode });
      
      if (mode === 'day') {
        // No modo "day", sempre substituir todos os agendamentos
        console.log('🔄 Modo DAY: Substituindo agendamentos');
        setAppointments((data || []) as Appointment[]);
      } else {
        // No modo "week", verificar se já temos agendamentos desta data
        setAppointments(prev => {
          const newAppointments = (data || []) as Appointment[];
          console.log('🔄 Modo WEEK: Verificando agendamentos existentes');
          
          // Remover agendamentos da mesma data para evitar duplicatas
          const filteredPrev = prev.filter(app => {
            const appDate = format(new Date(app.appointment_date), 'yyyy-MM-dd');
            return appDate !== date;
          });
          
          console.log('📊 Agendamentos filtrados:', filteredPrev.length, 'novos:', newAppointments.length);
          return [...filteredPrev, ...newAppointments];
        });
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar agendamentos:', error);
      toast({
        title: "Erro ao carregar agendamentos",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData: CreateAppointmentData): Promise<boolean> => {
    if (!profile?.barbershop_id) return false;

    try {
      // Validar se o horário não está no passado
      const appointmentDateTime = new Date(`${appointmentData.appointment_date}T${appointmentData.start_time}`);
      const now = new Date();
      const safetyMargin = 30 * 60000; // 30 minutos em ms
      
      if (appointmentDateTime <= new Date(now.getTime() + safetyMargin)) {
        toast({
          title: "Horário inválido",
          description: "Não é possível agendar para um horário que já passou.",
          variant: "destructive",
        });
        return false;
      }

      // Calcular horário de fim baseado na duração do serviço
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', appointmentData.service_id)
        .single();

      if (serviceError) throw serviceError;

      // Calcular end_time
      const startTime = new Date(`2000-01-01T${appointmentData.start_time}`);
      const endTime = new Date(startTime.getTime() + serviceData.duration_minutes * 60000);
      const end_time = endTime.toTimeString().slice(0, 5);

      // Verificar conflitos de horário
      const { data: conflicts, error: conflictError } = await supabase
        .from('appointments')
        .select('id')
        .eq('barber_id', appointmentData.barber_id)
        .eq('appointment_date', appointmentData.appointment_date)
        .neq('status', 'cancelled')
        .lt('start_time', end_time)
        .gt('end_time', appointmentData.start_time);

      if (conflictError) throw conflictError;
      
      if (conflicts && conflicts.length > 0) {
        toast({
          title: "Conflito de horário",
          description: "Já existe um agendamento neste horário para este barbeiro.",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            ...appointmentData,
            end_time,
            barbershop_id: profile.barbershop_id,
            status: 'scheduled'
          }
        ])
        .select(`
          *,
          client:clients(id, name, phone, email),
          service:services(id, name, duration_minutes),
          barber:profiles!appointments_barber_id_fkey(id, full_name)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        toast({
          title: "Erro ao criar agendamento",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setAppointments(prev => [...prev, data as Appointment]);
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro ao criar agendamento",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateAppointment = async (appointmentId: string, updateData: Partial<CreateAppointmentData>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select(`
          *,
          client:clients(id, name, phone, email),
          service:services(id, name, duration_minutes),
          barber:profiles!appointments_barber_id_fkey(id, full_name)
        `)
        .single();

      if (error) {
        console.error('Erro ao atualizar agendamento:', error);
        toast({
          title: "Erro ao atualizar agendamento",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setAppointments(prev => prev.map(appointment => 
        appointment.id === appointmentId ? data as Appointment : appointment
      ));
      
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso.",
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar agendamento:', error);
      toast({
        title: "Erro ao atualizar agendamento",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelAppointment = async (appointmentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast({
          title: "Erro ao cancelar agendamento",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setAppointments(prev => prev.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status: 'cancelled' as const }
          : appointment
      ));
      
      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso.",
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro ao cancelar agendamento",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAppointment = async (appointmentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        console.error('Erro ao deletar agendamento:', error);
        toast({
          title: "Erro ao deletar agendamento",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setAppointments(prev => prev.filter(appointment => appointment.id !== appointmentId));
      toast({
        title: "Agendamento removido",
        description: "O agendamento foi removido com sucesso.",
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao deletar agendamento:', error);
      toast({
        title: "Erro ao deletar agendamento",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Buscar horários disponíveis para um barbeiro em uma data específica
  const getAvailableTimeSlots = (barberId: string, date: string, serviceDuration: number = 30) => {
    const dayAppointments = appointments.filter(
      apt => apt.barber_id === barberId && 
             apt.appointment_date === date && 
             apt.status !== 'cancelled'
    );

    // TODO: Integrate with useBarbershopSettings to get dynamic time slots
    // For now, using default slots but this should be updated to use barbershop's opening hours
    const allTimeSlots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
      "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];

    return allTimeSlots.filter(timeSlot => {
      const slotStart = new Date(`2000-01-01T${timeSlot}`);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      return !dayAppointments.some(apt => {
        const aptStart = new Date(`2000-01-01T${apt.start_time}`);
        const aptEnd = new Date(`2000-01-01T${apt.end_time}`);
        
        return (slotStart < aptEnd && slotEnd > aptStart);
      });
    });
  };

  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchAppointments();
    }
  }, [profile?.barbershop_id]);

  const getClientAppointments = async (clientId: string) => {
    try {
      const { data, error } = await supabase
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
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('Error fetching client appointments:', error);
        toast({
          title: "Erro ao buscar agendamentos",
          description: "Erro ao buscar agendamentos do cliente",
          variant: "destructive",
        });
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClientAppointments:', error);
      toast({
        title: "Erro ao buscar agendamentos",
        description: "Erro ao buscar agendamentos do cliente",
        variant: "destructive",
      });
      return [];
    }
  };

  return {
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment,
    fetchAppointments,
    getAvailableTimeSlots,
    getClientAppointments,
    setAppointments,
  };
};