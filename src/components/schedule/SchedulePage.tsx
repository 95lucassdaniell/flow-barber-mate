import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBarberSelection } from '@/hooks/useBarberSelection';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentModal } from './AppointmentModal';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { useScheduleUrl } from '@/hooks/useScheduleUrl';
import { SimpleGridScheduleView } from './SimpleGridScheduleView';
import { useBarbershopSettings } from '@/hooks/useBarbershopSettings';
import { toast } from "sonner";
import { useLoadingContext } from '@/contexts/LoadingContext';
import EmergencyStopUI from '@/components/debug/EmergencyStopUI';

const SchedulePage = () => {
  const { profile } = useAuth();
  const { selectedDate, navigateToDate, navigateToToday } = useScheduleUrl();
  const { barbers, loading: barbersLoading } = useBarberSelection();
  const { appointments, loading: appointmentsLoading, fetchAppointments } = useAppointments();
  const { isOpenOnDate } = useBarbershopSettings();
  const { setLoading, isLoading } = useLoadingContext();
  
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedBarberId_, setSelectedBarberId_] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const formattedDate = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  // Controlar loading no contexto centralizado
  useEffect(() => {
    const isPageLoading = barbersLoading || appointmentsLoading;
    setLoading('schedule', isPageLoading);
    
    // Timeout de emergência de 4 segundos
    if (isPageLoading) {
      const timer = setTimeout(() => {
        setLoading('schedule', false);
        toast.error('Carregamento demorou muito. Dados podem estar desatualizados.');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [barbersLoading, appointmentsLoading, setLoading]);

  // Fetch appointments simplificado
  useEffect(() => {
    if (profile?.barbershop_id && !barbersLoading) {
      const timer = setTimeout(() => {
        fetchAppointments(undefined, formattedDate, 'day');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [profile?.barbershop_id, formattedDate, barbersLoading, fetchAppointments]);

  const handleTimeSlotClick = (barberId: string, timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setSelectedBarberId_(barberId);
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(false);
    setIsAppointmentModalOpen(true);
  };

  const handleNavigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === "next" ? 1 : -1));
    navigateToDate(newDate);
  };

  const handleNewAppointment = () => {
    setSelectedTimeSlot('');
    setSelectedBarberId_('');
    setSelectedAppointment(null);
    setIsAppointmentModalOpen(true);
  };

  const handleRefreshAppointments = () => {
    fetchAppointments(undefined, formattedDate, 'day');
  };

  // Loading states simplificados
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (isLoading('schedule')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando agenda...</p>
          <p className="text-xs text-muted-foreground mt-2">
            {barbersLoading ? 'Buscando barbeiros...' : 'Buscando agendamentos...'}
          </p>
        </div>
      </div>
    );
  }

  const isOpen = isOpenOnDate(selectedDate);

  if (!isOpen) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">Barbearia Fechada</p>
          <p className="text-sm text-muted-foreground">A barbearia está fechada no dia selecionado.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <EmergencyStopUI />
      <div>
        <SimpleGridScheduleView
          date={selectedDate}
          barbers={barbers}
          appointments={appointments}
          onAppointmentClick={handleAppointmentClick}
          onTimeSlotClick={handleTimeSlotClick}
          onNavigateDate={handleNavigateDate}
          onGoToToday={navigateToToday}
          onNewAppointment={handleNewAppointment}
        />

        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setSelectedAppointment(null);
          }}
          selectedDate={selectedDate}
          selectedTime={selectedTimeSlot}
          selectedBarberId={selectedBarberId_}
          appointment={selectedAppointment}
          onAppointmentCreated={() => {
            setIsAppointmentModalOpen(false);
            setSelectedAppointment(null);
          }}
        />

        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedAppointment(null);
          }}
          onEdit={handleEditAppointment}
          onRefresh={handleRefreshAppointments}
        />
      </div>
    </>
  );
};

export default SchedulePage;