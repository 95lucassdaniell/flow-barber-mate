import { AppointmentCard } from "./AppointmentCard";
import { Plus } from "lucide-react";

interface Appointment {
  id: string;
  client_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  
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

interface Barber {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface BarberColumnProps {
  barber: Barber;
  timeSlots: string[];
  appointments: Appointment[];
  barberColor: string;
  onTimeSlotClick: (barberId: string, timeSlot: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

export const BarberColumn = ({
  barber,
  timeSlots,
  appointments,
  barberColor,
  onTimeSlotClick,
  onAppointmentClick
}: BarberColumnProps) => {
  const calculateSlotsCount = (appointment: Appointment): number => {
    if (!appointment.service?.duration_minutes) return 1;
    return Math.ceil(appointment.service.duration_minutes / 15);
  };

  const isAppointmentInSlot = (appointment: Appointment, timeSlot: string): boolean => {
    const [startHour, startMinute] = appointment.start_time.split(':').map(Number);
    const [endHour, endMinute] = appointment.end_time.split(':').map(Number);
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const slotTotalMinutes = slotHour * 60 + slotMinute;

    return slotTotalMinutes >= startTotalMinutes && slotTotalMinutes < endTotalMinutes;
  };

  const getAppointmentForSlot = (timeSlot: string): Appointment | null => {
    return appointments.find(appointment => 
      appointment.barber_id === barber.id && 
      isAppointmentInSlot(appointment, timeSlot)
    ) || null;
  };

  const isSlotOccupiedByPreviousAppointment = (timeSlot: string): Appointment | null => {
    const appointment = getAppointmentForSlot(timeSlot);
    if (!appointment) return null;
    
    return appointment.start_time !== timeSlot ? appointment : null;
  };

  return (
    <div className="flex flex-col">
      {/* Header do barbeiro */}
      <div 
        className="h-12 p-3 text-center font-semibold text-white border-r border-border flex items-center justify-center"
        style={{ backgroundColor: barberColor }}
      >
        {barber.full_name}
      </div>

      {/* Slots de horário */}
      <div className="flex flex-col border-r border-border">
        {timeSlots.map((timeSlot) => {
          const appointment = getAppointmentForSlot(timeSlot);
          const isOccupiedByPrevious = isSlotOccupiedByPreviousAppointment(timeSlot);

          if (appointment && !isOccupiedByPrevious) {
            // Slot com agendamento (primeiro slot do agendamento)
            const slotsCount = calculateSlotsCount(appointment);
            return (
              <AppointmentCard
                key={`${appointment.id}-${timeSlot}`}
                appointment={appointment}
                onClick={() => onAppointmentClick(appointment)}
                slotsCount={slotsCount}
                barberColor={barberColor}
              />
            );
          } else if (isOccupiedByPrevious) {
            // Slot ocupado por agendamento anterior
            return (
              <div 
                key={`occupied-${barber.id}-${timeSlot}`} 
                className="h-10 border-b border-border/50"
                style={{ backgroundColor: `${barberColor}20` }}
              />
            );
          } else {
            // Slot disponível
            return (
              <div
                key={`slot-${barber.id}-${timeSlot}`}
                className="h-10 border-b border-border/50 bg-background hover:bg-muted/30 cursor-pointer transition-colors flex items-center justify-center group"
                onClick={() => onTimeSlotClick(barber.id, timeSlot)}
              >
                <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};