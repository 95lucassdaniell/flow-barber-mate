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
        className="p-3 text-center font-semibold text-white rounded-t-lg"
        style={{ backgroundColor: barberColor }}
      >
        {barber.full_name}
      </div>

      {/* Slots de horário */}
      <div className="flex flex-col border-l border-r border-b rounded-b-lg">
        {timeSlots.map((timeSlot) => {
          const appointment = getAppointmentForSlot(timeSlot);
          const isOccupiedByPrevious = isSlotOccupiedByPreviousAppointment(timeSlot);

          if (appointment && !isOccupiedByPrevious) {
            // Slot com agendamento (primeiro slot do agendamento)
            const slotsCount = calculateSlotsCount(appointment);
            return (
              <div key={`${barber.id}-${timeSlot}`} className="h-10 border-b border-border">
                <AppointmentCard
                  appointment={appointment}
                  onClick={() => onAppointmentClick(appointment)}
                  slotsCount={slotsCount}
                  barberColor={barberColor}
                />
              </div>
            );
          } else if (isOccupiedByPrevious) {
            // Slot ocupado por agendamento anterior (não renderizar nada)
            return (
              <div key={`${barber.id}-${timeSlot}`} className="h-10 border-b border-border bg-muted/20">
                {/* Slot ocupado por agendamento que começou antes */}
              </div>
            );
          } else {
            // Slot disponível
            return (
              <div
                key={`${barber.id}-${timeSlot}`}
                className="h-10 border-b border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-center group"
                onClick={() => onTimeSlotClick(barber.id, timeSlot)}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{timeSlot}</span>
                  <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">Disponível</span>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};