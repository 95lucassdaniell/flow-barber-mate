import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useBarbershopSettings } from './useBarbershopSettings';
import { globalState, cacheManager } from '@/lib/globalState';
import { createLocalDate } from '@/lib/dateUtils';

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
  const realtimeChannelRef = useRef<any>(null);
  const { isTimeSlotAvailable, isOpenOnDate, generateTimeSlots, isTimeSlotInPast } = useBarbershopSettings();

  // Setup real-time subscription
  useEffect(() => {
    if (!profile?.barbershop_id) return;

    // Cleanup previous subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    // Create new subscription for appointments
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `barbershop_id=eq.${profile.barbershop_id}`
        },
        async (payload) => {
          console.log('Real-time: Nova appointment inserida:', payload.new);
          
          // Fetch the full appointment with relations
          const { data } = await supabase
            .from('appointments')
            .select(`
              *,
              client:clients(id, name, phone, email),
              service:services(id, name, duration_minutes),
              barber:profiles!appointments_barber_id_fkey(id, full_name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setAppointments(prev => {
              // Evitar duplicatas
              if (prev.some(apt => apt.id === data.id)) return prev;
              return [...prev, data as Appointment];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `barbershop_id=eq.${profile.barbershop_id}`
        },
        async (payload) => {
          console.log('Real-time: Appointment atualizada:', payload.new);
          
          // Fetch the full appointment with relations
          const { data } = await supabase
            .from('appointments')
            .select(`
              *,
              client:clients(id, name, phone, email),
              service:services(id, name, duration_minutes),
              barber:profiles!appointments_barber_id_fkey(id, full_name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setAppointments(prev => 
              prev.map(apt => apt.id === data.id ? data as Appointment : apt)
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'appointments',
          filter: `barbershop_id=eq.${profile.barbershop_id}`
        },
        (payload) => {
          console.log('Real-time: Appointment deletada:', payload.old);
          setAppointments(prev => 
            prev.filter(apt => apt.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [profile?.barbershop_id]);

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
      // 🔧 CORREÇÃO CRÍTICA: Usar createLocalDate em vez de new Date
      const appointmentDate = createLocalDate(appointmentData.appointment_date);
      
      console.log('🎯 CREATE APPOINTMENT - START:', {
        appointmentData,
        appointmentDate: appointmentDate.toISOString(),
        appointmentDateLocal: appointmentDate.toLocaleDateString('pt-BR'),
        appointmentDateTime: appointmentDate.toLocaleString('pt-BR')
      });
      
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
        barberId: appointmentData.barber_id,
        isOpen: isOpenOnDate(appointmentDate),
        isPast: isTimeSlotInPast(appointmentDate, appointmentData.start_time)
      });

      // First check basic availability (opening hours, not in past)
      const basicAvailable = isTimeSlotAvailable(appointmentDate, appointmentData.start_time, serviceDuration);
      console.log('📋 Basic availability result:', { basicAvailable });

      if (!basicAvailable) {
        toast({
          title: "Horário indisponível",
          description: "Este horário não está disponível para agendamento (fora do horário de funcionamento).",
          variant: "destructive",
        });
        return false;
      }

      // Now check for appointment conflicts using the real-time conflict check
      const availableSlots = getAvailableTimeSlots(appointmentData.barber_id, appointmentData.appointment_date, serviceDuration);
      const slotAvailable = availableSlots.includes(appointmentData.start_time);
      
      console.log('📋 Conflict check result:', { 
        slotAvailable, 
        totalAvailableSlots: availableSlots.length,
        requestedTime: appointmentData.start_time,
        availableSlots: availableSlots.slice(0, 5) // Show first 5 slots for debugging
      });

      if (!slotAvailable) {
        toast({
          title: "Horário indisponível",
          description: "Este horário já está ocupado. Tente outro horário.",
          variant: "destructive",
        });
        return false;
      }

      // Usar dados do serviço já obtidos anteriormente

      // Calcular end_time
      const startTime = new Date(`2000-01-01T${appointmentData.start_time}`);
      const endTime = new Date(startTime.getTime() + serviceData.duration_minutes * 60000);
      const end_time = endTime.toTimeString().slice(0, 5);

      // Verificar conflitos de horário - apenas agendamentos ativos
      const { data: conflicts, error: conflictError } = await supabase
        .from('appointments')
        .select('id')
        .eq('barber_id', appointmentData.barber_id)
        .eq('appointment_date', appointmentData.appointment_date)
        .in('status', ['scheduled', 'confirmed'])
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

      // Real-time subscription will handle adding the appointment
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
    // 🔧 CORREÇÃO CRÍTICA: Usar createLocalDate em vez de new Date(date)
    // new Date(date) interpreta como UTC, causando problemas de timezone
    const appointmentDate = createLocalDate(date);
    
    console.log('⏰ GET AVAILABLE TIME SLOTS:', {
      barberId,
      dateString: date,
      serviceDuration,
      appointmentDate: appointmentDate.toISOString(),
      appointmentDateLocal: appointmentDate.toLocaleDateString('pt-BR'),
      appointmentDateTime: appointmentDate.toLocaleTimeString('pt-BR')
    });
    
    // Verificar se a barbearia está aberta no dia
    if (!isOpenOnDate(appointmentDate)) {
      console.log('🚫 BARBERSHOP CLOSED on date:', { 
        dateString: date, 
        appointmentDate: appointmentDate.toLocaleDateString('pt-BR') 
      });
      return [];
    }
    
    console.log('✅ BARBERSHOP OPEN on date:', { 
      dateString: date, 
      appointmentDate: appointmentDate.toLocaleDateString('pt-BR') 
    });

    const dayAppointments = appointments.filter(
      apt => apt.barber_id === barberId && 
             apt.appointment_date === date && 
             (apt.status === 'scheduled' || apt.status === 'confirmed')
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
    
    console.log('🕐 TIME SLOTS GENERATED:', {
      dateString: date,
      appointmentDate: appointmentDate.toLocaleDateString('pt-BR'),
      serviceDuration,
      totalSlots: allTimeSlots.length,
      firstSlot: allTimeSlots[0],
      lastSlot: allTimeSlots[allTimeSlots.length - 1],
      allSlots: allTimeSlots
    });

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