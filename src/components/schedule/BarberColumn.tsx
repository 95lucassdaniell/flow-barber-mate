import { AppointmentCard } from "./AppointmentCard";
import { Plus } from "lucide-react";
import { Appointment, Barber } from "@/types/appointment";

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
  const SLOT_HEIGHT = 60;
  
  const getAppointmentSlotsCount = (appointment: Appointment): number => {
    const duration = appointment.service?.duration_minutes || 30;
    return Math.ceil(duration / 15);
  };

  const isAppointmentInSlot = (appointment: Appointment, timeSlot: string): boolean => {
    const normalizedStartTime = appointment.start_time.slice(0, 5);
    const normalizedEndTime = appointment.end_time.slice(0, 5);
    
    return timeSlot >= normalizedStartTime && timeSlot < normalizedEndTime;
  };

  const getAppointmentForSlot = (timeSlot: string): Appointment | null => {
    return appointments.find(apt => 
      apt.barber_id === barber.id &&
      apt.start_time === timeSlot
    ) || null;
  };

  const isSlotOccupiedByPreviousAppointment = (timeSlot: string): Appointment | null => {
    return appointments.find(apt => 
      apt.barber_id === barber.id &&
      apt.start_time !== timeSlot &&
      isAppointmentInSlot(apt, timeSlot)
    ) || null;
  };

  return (
    <div className="flex-1 border-r border-border min-w-[200px]">
      {/* Header */}
      <div 
        className="h-12 bg-muted border-b border-border flex items-center justify-center px-3"
        style={{ backgroundColor: `${barberColor}20` }}
      >
        <span className="text-sm font-semibold text-foreground truncate">
          {barber.full_name}
        </span>
      </div>
      
      {/* Time slots */}
      <div className="space-y-0">
        {timeSlots.map((timeSlot) => {
          const appointment = getAppointmentForSlot(timeSlot);
          const occupiedByPrevious = isSlotOccupiedByPreviousAppointment(timeSlot);
          
          return (
            <div 
              key={timeSlot}
              className="border-b border-border/50 relative"
              style={{ minHeight: `${SLOT_HEIGHT}px` }}
            >
              {appointment ? (
                <AppointmentCard
                  appointment={appointment}
                  barberColor={barberColor}
                  onClick={() => onAppointmentClick(appointment)}
                  slotsCount={getAppointmentSlotsCount(appointment)}
                />
              ) : occupiedByPrevious ? (
                <div className="h-full bg-gray-100 opacity-50" />
              ) : (
                <div 
                  className="h-full hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-center"
                  onClick={() => onTimeSlotClick(barber.id, timeSlot)}
                >
                  <Plus className="h-4 w-4 text-muted-foreground opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};