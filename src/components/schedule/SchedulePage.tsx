import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBarberSelection } from '@/hooks/useBarberSelection';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentModal } from './AppointmentModal';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { useScheduleUrl } from '@/hooks/useScheduleUrl';
import { useDebounce } from '@/hooks/useDebounce';
import { SimpleGridScheduleView } from './SimpleGridScheduleView';
import { useBarbershopSettings } from '@/hooks/useBarbershopSettings';
import { toast } from "sonner";

const SchedulePage = () => {
  const { profile } = useAuth();
  const { selectedDate, navigateToDate, navigateToToday } = useScheduleUrl();
  const { barbers, loading: barbersLoading } = useBarberSelection();
  const { appointments, loading: appointmentsLoading, fetchAppointments } = useAppointments();
  const { isOpenOnDate } = useBarbershopSettings();
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedBarberId_, setSelectedBarberId_] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Debounce the date changes to avoid too many API calls
  const debouncedDate = useDebounce(selectedDate, 300);

  // Loading timeout to prevent infinite loading
  useEffect(() => {
    if (barbersLoading || appointmentsLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
        console.warn('SchedulePage: Loading timeout reached');
        toast.error('Carregamento demorou muito. Tente recarregar a página.');
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [barbersLoading, appointmentsLoading]);

  // Fetch appointments when date changes - get all barbers' appointments
  useEffect(() => {
    console.log('SchedulePage: Checking fetch conditions', {
      profile_barbershop_id: profile?.barbershop_id,
      barbersLoading,
      barbersCount: barbers.length,
      selectedDate: format(debouncedDate, 'yyyy-MM-dd')
    });

    if (!profile?.barbershop_id) {
      console.log('SchedulePage: No barbershop_id, skipping fetch');
      return;
    }
    
    if (barbersLoading) {
      console.log('SchedulePage: Barbers still loading, skipping fetch');
      return;
    }

    console.log('SchedulePage: Fetching appointments for date', format(debouncedDate, 'yyyy-MM-dd'));
    fetchAppointments(undefined, format(debouncedDate, 'yyyy-MM-dd'), 'day');
  }, [profile?.barbershop_id, debouncedDate, barbersLoading]);

  const handleTimeSlotClick = (barberId: string, timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setSelectedBarberId_(barberId);
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentClick = (appointment: any) => {
    console.log('Appointment clicked:', appointment);
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

  // Check if barbershop is open on selected date
  const isOpen = isOpenOnDate(selectedDate);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (barbersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando barbeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!isOpen ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">Barbearia Fechada</p>
            <p className="text-sm text-muted-foreground">A barbearia está fechada no dia selecionado.</p>
          </div>
        </div>
      ) : appointmentsLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando agendamentos...</p>
          </div>
        </div>
      ) : (
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
      )}

      {/* Appointment Modal */}
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
          fetchAppointments(undefined, format(selectedDate, 'yyyy-MM-dd'), 'day');
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
        onRefresh={() => fetchAppointments(undefined, format(selectedDate, 'yyyy-MM-dd'), 'day')}
      />
    </div>
  );
};

export default SchedulePage;