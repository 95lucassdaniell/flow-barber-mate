import { AppointmentCard } from "./AppointmentCard";
import { Plus } from "lucide-react";
import { SLOT_HEIGHT_PX, calculateSlotsCount, isTimeInRange } from "@/lib/utils";

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
  const getAppointmentSlotsCount = (appointment: Appointment): number => {
    if (!appointment.service?.duration_minutes) return 1;
    return calculateSlotsCount(appointment.service.duration_minutes);
  };

  const isAppointmentInSlot = (appointment: Appointment, timeSlot: string): boolean => {
    // Normalizar formato dos horários (HH:MM:SS -> HH:MM)
    const normalizedStartTime = appointment.start_time.slice(0, 5);
    const normalizedEndTime = appointment.end_time.slice(0, 5);
    
    return isTimeInRange(timeSlot, normalizedStartTime, normalizedEndTime);
  };

  const getAppointmentForSlot = (timeSlot: string): Appointment | null => {
    const appointment = appointments.find(appointment => 
      appointment.barber_id === barber.id && 
      isAppointmentInSlot(appointment, timeSlot)
    ) || null;
    
    if (appointment) {
      console.log(`Found appointment for ${barber.full_name} at ${timeSlot}:`, appointment);
    }
    
    return appointment;
  };

  const isSlotOccupiedByPreviousAppointment = (timeSlot: string): Appointment | null => {
    const appointment = getAppointmentForSlot(timeSlot);
    if (!appointment) return null;
    
    // Normalizar formato para comparação
    const normalizedStartTime = appointment.start_time.slice(0, 5);
    return normalizedStartTime !== timeSlot ? appointment : null;
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

          console.log(`Slot ${timeSlot} for ${barber.full_name}:`, { 
            hasAppointment: !!appointment, 
            isStartSlot: appointment?.start_time.slice(0, 5) === timeSlot,
            isOccupiedByPrevious: !!isOccupiedByPrevious,
            appointmentData: appointment ? {
              id: appointment.id,
              client: appointment.client?.name,
              service: appointment.service?.name,
              start_time: appointment.start_time,
              end_time: appointment.end_time
            } : null
          });

          if (appointment && appointment.start_time.slice(0, 5) === timeSlot) {
            // Slot com agendamento (primeiro slot do agendamento)
            const slotsCount = getAppointmentSlotsCount(appointment);
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
                className="border-b border-border/50 bg-muted/20"
                style={{ height: `${SLOT_HEIGHT_PX}px` }}
              />
            );
          } else {
            // Slot disponível
            return (
              <div
                key={`slot-${barber.id}-${timeSlot}`}
                className="border-b border-border/50 bg-background hover:bg-muted/30 cursor-pointer transition-colors flex items-center justify-center group"
                style={{ height: `${SLOT_HEIGHT_PX}px` }}
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