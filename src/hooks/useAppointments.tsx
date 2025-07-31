import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useBarbershopSettings } from './useBarbershopSettings';
import { globalState, cacheManager } from '@/lib/globalState';

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
  const abortControllerRef = useRef<AbortController>();
  const lastSuccessfulFetchRef = useRef<string>('');
  const { isTimeSlotAvailable, isOpenOnDate, generateTimeSlots, isTimeSlotInPast } = useBarbershopSettings();

  const fetchAppointments = useCallback(async (barberId?: string, date?: string, mode: 'day' | 'week' = 'day') => {
    if (!profile?.barbershop_id || globalState.isEmergencyStopActive()) return;

    const fetchKey = `appointments-${barberId || 'all'}-${date || 'all'}-${mode}-${profile.barbershop_id}`;
    
    // Verificar cache primeiro
    const cached = cacheManager.get<Appointment[]>(fetchKey);
    if (cached && lastSuccessfulFetchRef.current !== fetchKey) {
      setAppointments(cached);
      lastSuccessfulFetchRef.current = fetchKey;
      return;
    }

    // Verificar se já temos a mesma requisição
    if (lastSuccessfulFetchRef.current === fetchKey) {
      return;
    }

    try {
      // Cancelar requisição anterior se existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      
      // Para modo "day", limpar agendamentos
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
        .eq('barbershop_id', profile.barbershop_id)
        .abortSignal(abortControllerRef.current.signal);

      if (barberId) {
        query = query.eq('barber_id', barberId);
      }

      if (date) {
        query = query.eq('appointment_date', date);
      } else {
        const today = format(new Date(), 'yyyy-MM-dd');
        query = query.eq('appointment_date', today);
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(500);

      if (error) {
        if (error.name === 'AbortError') return;
        throw error;
      }

      const appointments = (data || []) as Appointment[];
      
      // Cache dos dados
      cacheManager.set(fetchKey, appointments, 60000); // 1 min cache
      lastSuccessfulFetchRef.current = fetchKey;

      if (mode === 'day') {
        setAppointments(appointments);
      } else {
        setAppointments(prev => {
          const filteredPrev = prev.filter(app => {
            const appDate = format(new Date(app.appointment_date), 'yyyy-MM-dd');
            return appDate !== date;
          });
          return [...filteredPrev, ...appointments];
        });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      
      console.error('Erro ao buscar agendamentos:', error);
      toast({
        title: "Erro ao carregar agendamentos",
        description: "Ocorreu um erro ao buscar os agendamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.barbershop_id, toast]);

  const createAppointment = async (appointmentData: CreateAppointmentData): Promise<boolean> => {
    if (!profile?.barbershop_id) return false;

    try {
      const appointmentDate = new Date(appointmentData.appointment_date);
      
      // Verificar se a barbearia está aberta no dia
      if (!isOpenOnDate(appointmentDate)) {
        toast({
          title: "Barbearia fechada",
          description: "A barbearia está fechada no dia selecionado.",
          variant: "destructive",
        });
        return false;
      }

      // Buscar duração do serviço antes da validação
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', appointmentData.service_id)
        .single();

      if (serviceError) throw serviceError;
      
      const serviceDuration = serviceData.duration_minutes || 15;

      // Debug: Verificar detalhes da validação
      console.log('🔍 Validating appointment:', {
        date: appointmentData.appointment_date,
        time: appointmentData.start_time,
        duration: serviceDuration,
        isOpen: isOpenOnDate(appointmentDate),
        isPast: isTimeSlotInPast(appointmentDate, appointmentData.start_time)
      });

      // Verificar se o horário está disponível considerando a duração do serviço
      const available = isTimeSlotAvailable(appointmentDate, appointmentData.start_time, serviceDuration);
      console.log('📋 Availability result:', { available });

      if (!available) {
        toast({
          title: "Horário indisponível",
          description: "Este horário não está disponível para agendamento.",
          variant: "destructive",
        });
        return false;
      }

      // Usar dados do serviço já obtidos anteriormente

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

  // Função para converter horário em minutos
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Buscar horários disponíveis para um barbeiro em uma data específica
  const getAvailableTimeSlots = (barberId: string, date: string, serviceDuration: number = 15) => {
    const appointmentDate = new Date(date);
    
    // Verificar se a barbearia está aberta no dia
    if (!isOpenOnDate(appointmentDate)) {
      return [];
    }

    const dayAppointments = appointments.filter(
      apt => apt.barber_id === barberId && 
             apt.appointment_date === date && 
             apt.status !== 'cancelled'
    );

    // Filtrar e logar agendamentos corrompidos
    const validAppointments = dayAppointments.filter(apt => {
      const startMinutes = timeToMinutes(apt.start_time);
      const endMinutes = timeToMinutes(apt.end_time);
      
      if (endMinutes <= startMinutes) {
        console.warn(`⚠️ Agendamento com horários inválidos ignorado:`, {
          appointmentId: apt.id,
          start_time: apt.start_time,
          end_time: apt.end_time,
          client: apt.client?.name,
          barber: apt.barber?.full_name,
          date: apt.appointment_date
        });
        return false;
      }
      return true;
    });

    // Usar horários dinâmicos da barbearia considerando duração do serviço
    const allTimeSlots = generateTimeSlots(appointmentDate, 15, serviceDuration);

    return allTimeSlots.filter(timeSlot => {
      const slotStart = new Date(`2000-01-01T${timeSlot}`);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      const hasConflict = validAppointments.some(apt => {
        const aptStart = new Date(`2000-01-01T${apt.start_time}`);
        const aptEnd = new Date(`2000-01-01T${apt.end_time}`);
        
        return (slotStart < aptEnd && slotEnd > aptStart);
      });

      if (hasConflict) {
        const conflictingAppointment = validAppointments.find(apt => {
          const aptStart = new Date(`2000-01-01T${apt.start_time}`);
          const aptEnd = new Date(`2000-01-01T${apt.end_time}`);
          return (slotStart < aptEnd && slotEnd > aptStart);
        });

        console.log(`❌ Slot ${timeSlot} indisponível devido a conflito:`, {
          slot: { start: timeSlot, duration: `${serviceDuration}min` },
          conflictingAppointment: conflictingAppointment ? {
            id: conflictingAppointment.id,
            start: conflictingAppointment.start_time,
            end: conflictingAppointment.end_time,
            client: conflictingAppointment.client?.name
          } : 'desconhecido'
        });
      }

      return !hasConflict;
    });
  };

  // Memoized initial fetch - only when barbershop_id changes
  const stableBarbershopId = useMemo(() => profile?.barbershop_id, [profile?.barbershop_id]);

  useEffect(() => {
    if (stableBarbershopId && !globalState.isEmergencyStopActive()) {
      // Debounce inicial para evitar chamadas múltiplas
      const timer = setTimeout(() => {
        fetchAppointments();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [stableBarbershopId]); // Removed fetchAppointments dependency

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

  // Memoized returns para evitar re-renders desnecessários
  const returnValue = useMemo(() => ({
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment,
    fetchAppointments,
    getAvailableTimeSlots,
    getClientAppointments,
    setAppointments
  }), [
    appointments,
    loading,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment,
    fetchAppointments,
    getAvailableTimeSlots,
    getClientAppointments
  ]);

  return returnValue;
};