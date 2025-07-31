import { AbsoluteAppointmentCard } from "./AbsoluteAppointmentCard";
import { Plus } from "lucide-react";
import { parseTimeToMinutes, HOUR_LINE_HEIGHT } from "@/lib/utils";

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

interface NewBarberColumnProps {
  barber: Barber;
  appointments: Appointment[];
  barberColor: string;
  timeSlots: string[];
  dayStartTime: string;
  dayEndTime: string;
  onAppointmentClick: (appointment: Appointment) => void;
  onTimeSlotClick: (barberId: string, timeSlot: string) => void;
}

export const NewBarberColumn = ({
  barber,
  appointments,
  barberColor,
  timeSlots,
  dayStartTime,
  dayEndTime,
  onAppointmentClick,
  onTimeSlotClick
}: NewBarberColumnProps) => {
  // Filter appointments for this barber
  const barberAppointments = appointments.filter(apt => apt.barber_id === barber.id);
  
  // Calculate total height based on operating hours
  const startMinutes = parseTimeToMinutes(dayStartTime);
  const endMinutes = parseTimeToMinutes(dayEndTime);
  const totalMinutes = endMinutes - startMinutes;
  const totalHeight = (totalMinutes / 60) * HOUR_LINE_HEIGHT;

  // Detect overlapping appointments
  const appointmentsWithOverlap = barberAppointments.map(appointment => {
    const overlapping = barberAppointments.filter(other => {
      if (other.id === appointment.id) return false;
      
      const thisStart = parseTimeToMinutes(appointment.start_time);
      const thisEnd = parseTimeToMinutes(appointment.end_time);
      const otherStart = parseTimeToMinutes(other.start_time);
      const otherEnd = parseTimeToMinutes(other.end_time);
      
      return (thisStart < otherEnd && thisEnd > otherStart);
    });
    
    return {
      ...appointment,
      overlapping: overlapping.length + 1,
      overlapIndex: overlapping.filter(other => 
        parseTimeToMinutes(other.start_time) <= parseTimeToMinutes(appointment.start_time)
      ).length
    };
  });

  const handleColumnClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top - 48; // Subtract header height
    
    // Calculate which time slot was clicked
    const minutesFromStart = (y / HOUR_LINE_HEIGHT) * 60;
    const clickedMinutes = startMinutes + minutesFromStart;
    
    // Round to nearest 15-minute slot
    const roundedMinutes = Math.round(clickedMinutes / 15) * 15;
    const hours = Math.floor(roundedMinutes / 60);
    const mins = roundedMinutes % 60;
    const timeSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    
    onTimeSlotClick(barber.id, timeSlot);
  };

  return (
    <div className="flex-1 border-r border-border/30 min-w-[200px]">
      {/* Header */}
      <div 
        className="h-12 bg-muted/50 border-b border-border flex items-center justify-center px-3"
        style={{ backgroundColor: `${barberColor}20` }}
      >
        <span className="text-sm font-semibold text-foreground truncate">
          {barber.full_name}
        </span>
      </div>
      
      {/* Schedule area with relative positioning for absolute appointments */}
      <div 
        className="relative bg-background cursor-pointer hover:bg-muted/10 transition-colors"
        style={{ height: `${totalHeight}px` }}
        onClick={handleColumnClick}
      >
        {/* Hour lines background */}
        {timeSlots.map((_, index) => (
          <div
            key={index}
            className="absolute w-full border-b border-border/20"
            style={{ 
              top: `${index * HOUR_LINE_HEIGHT}px`,
              height: `${HOUR_LINE_HEIGHT}px`
            }}
          />
        ))}
        
        {/* Plus icon hint */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20 hover:opacity-40 transition-opacity pointer-events-none">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        
        {/* Appointments positioned absolutely */}
        {appointmentsWithOverlap.map((appointment) => (
          <AbsoluteAppointmentCard
            key={appointment.id}
            appointment={appointment}
            barberColor={barberColor}
            dayStartTime={dayStartTime}
            overlapping={appointment.overlapping}
            overlapIndex={appointment.overlapIndex}
            onClick={() => onAppointmentClick(appointment)}
          />
        ))}
      </div>
    </div>
  );
};