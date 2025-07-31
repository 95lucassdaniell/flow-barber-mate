import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProviderAuth } from "@/hooks/useProviderAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { SimpleGridScheduleView } from "@/components/schedule/SimpleGridScheduleView";
import { AppointmentModal } from "@/components/schedule/AppointmentModal";
import { AppointmentDetailsModal } from "@/components/schedule/AppointmentDetailsModal";
import { useToast } from "@/components/ui/use-toast";
import { Appointment, Barber } from "@/types/appointment";

const ProviderSchedulePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ barberId: string; time: string } | null>(null);

  const { profile, isAuthenticated } = useProviderAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { slug } = useParams();

  const {
    appointments,
    loading: appointmentsLoading,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment,
    fetchAppointments
  } = useAppointments();


  // Fetch appointments for the provider and selected date
  useEffect(() => {
    if (profile?.id) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      fetchAppointments(profile.id, dateStr, 'day');
    }
  }, [profile?.id, selectedDate, fetchAppointments]);

  // Create provider as a barber for the schedule view
  const providerAsBarber: Barber = profile ? {
    id: profile.id,
    full_name: profile.full_name,
    role: 'barber',
    is_active: profile.is_active
  } : null;

  const handleNavigateDate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setSelectedDate(prev => subDays(prev, 1));
    } else {
      setSelectedDate(prev => addDays(prev, 1));
    }
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setSelectedTimeSlot(null);
    setShowAppointmentModal(true);
  };

  const handleTimeSlotClick = (barberId: string, timeSlot: string) => {
    if (barberId === profile?.id) {
      setSelectedTimeSlot({ barberId, time: timeSlot });
      setSelectedAppointment(null);
      setShowAppointmentModal(true);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    // Only allow viewing appointments that belong to this provider
    if (appointment.barber_id === profile?.id) {
      setSelectedAppointment(appointment);
      setShowDetailsModal(true);
    }
  };

  const handleCreateAppointment = async (appointmentData: any) => {
    try {
      // Ensure the appointment is assigned to the current provider
      const dataWithProvider = {
        ...appointmentData,
        barber_id: profile?.id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd')
      };

      const success = await createAppointment(dataWithProvider);
      if (success) {
        setShowAppointmentModal(false);
        setSelectedTimeSlot(null);
        toast({
          title: "Sucesso",
          description: "Agendamento criado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar agendamento.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAppointment = async (appointmentId: string, updateData: any) => {
    try {
      const success = await updateAppointment(appointmentId, updateData);
      if (success) {
        setShowDetailsModal(false);
        setSelectedAppointment(null);
        toast({
          title: "Sucesso",
          description: "Agendamento atualizado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar agendamento.",
        variant: "destructive",
      });
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const success = await cancelAppointment(appointmentId);
      if (success) {
        setShowDetailsModal(false);
        setSelectedAppointment(null);
        toast({
          title: "Sucesso",
          description: "Agendamento cancelado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar agendamento.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const success = await deleteAppointment(appointmentId);
      if (success) {
        setShowDetailsModal(false);
        setSelectedAppointment(null);
        toast({
          title: "Sucesso",
          description: "Agendamento excluído com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir agendamento.",
        variant: "destructive",
      });
    }
  };

  // Filter appointments to show only provider's appointments
  const providerAppointments = appointments.filter(
    appointment => appointment.barber_id === profile?.id
  );

  if (!profile || !providerAsBarber) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SimpleGridScheduleView
        date={selectedDate}
        barbers={[providerAsBarber]} // Only show the current provider
        appointments={providerAppointments}
        onNavigateDate={handleNavigateDate}
        onGoToToday={handleGoToToday}
        onNewAppointment={handleNewAppointment}
        onTimeSlotClick={handleTimeSlotClick}
        onAppointmentClick={handleAppointmentClick}
      />

      {showAppointmentModal && (
        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          selectedDate={selectedDate}
          selectedBarberId={profile.id}
          selectedTime={selectedTimeSlot?.time}
          appointment={selectedAppointment}
          onAppointmentCreated={() => {
            setShowAppointmentModal(false);
            setSelectedTimeSlot(null);
            if (profile?.id) {
              const dateStr = format(selectedDate, 'yyyy-MM-dd');
              fetchAppointments(profile.id, dateStr, 'day');
            }
          }}
        />
      )}

      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </>
  );
};

export default ProviderSchedulePage;