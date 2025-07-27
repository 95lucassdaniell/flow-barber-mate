import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBarberSelection } from '@/hooks/useBarberSelection';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentModal } from './AppointmentModal';
import { useScheduleUrl } from '@/hooks/useScheduleUrl';
import { useDebounce } from '@/hooks/useDebounce';
import { HorizontalGridSchedule } from './HorizontalGridSchedule';
import { CompactCalendar } from './CompactCalendar';
import { toast } from "sonner";

const SchedulePage = () => {
  const { profile } = useAuth();
  const { selectedDate, navigateToDate } = useScheduleUrl();
  const { barbers, loading: barbersLoading } = useBarberSelection();
  const { appointments, loading: appointmentsLoading, fetchAppointments } = useAppointments();
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedBarberId_, setSelectedBarberId_] = useState<string>('');

  // Debounce the date changes to avoid too many API calls
  const debouncedDate = useDebounce(selectedDate, 300);

  // Fetch appointments when date changes - get all barbers' appointments
  useEffect(() => {
    if (!profile?.barbershop_id || barbersLoading || barbers.length === 0) return;

    // Evitar múltiplas requests com um timeout
    const timeoutId = setTimeout(() => {
      fetchAppointments(undefined, format(debouncedDate, 'yyyy-MM-dd'), 'day');
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [profile?.barbershop_id, debouncedDate, barbersLoading, barbers.length]);

  const handleTimeSlotClick = (barberId: string, timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setSelectedBarberId_(barberId);
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentClick = (appointment: any) => {
    // TODO: Implement appointment details modal
    console.log('Appointment clicked:', appointment);
  };

  // Generate time slots for the day
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeSlot);
    }
  }

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
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header com calendário e controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agenda - {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </CardTitle>
            
            <div className="flex items-center gap-4">
              <CompactCalendar
                selectedDate={selectedDate}
                onDateSelect={navigateToDate}
              />
              
              <Button 
                onClick={() => setIsAppointmentModalOpen(true)} 
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Novo Agendamento
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid Schedule */}
      <Card>
        <CardContent className="pt-6">
          {appointmentsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Carregando agendamentos...</p>
              </div>
            </div>
          ) : (
            <HorizontalGridSchedule
              date={selectedDate}
              barbers={barbers}
              appointments={appointments}
              timeSlots={timeSlots}
              onTimeSlotClick={handleTimeSlotClick}
              onAppointmentClick={handleAppointmentClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTimeSlot}
        selectedBarberId={selectedBarberId_}
        onAppointmentCreated={() => {
          fetchAppointments(undefined, format(selectedDate, 'yyyy-MM-dd'), 'day');
        }}
      />
    </div>
  );
};

export default SchedulePage;