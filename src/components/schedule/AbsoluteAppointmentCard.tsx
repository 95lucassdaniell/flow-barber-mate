import { Badge } from "@/components/ui/badge";
import { Clock, User, Scissors } from "lucide-react";
import { calculateAppointmentHeight, calculateAppointmentTop } from "@/lib/utils";

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

interface AbsoluteAppointmentCardProps {
  appointment: Appointment;
  onClick?: () => void;
  barberColor: string;
  dayStartTime: string;
  overlapping?: number;
  overlapIndex?: number;
}

export const AbsoluteAppointmentCard = ({ 
  appointment, 
  onClick, 
  barberColor,
  dayStartTime,
  overlapping = 1,
  overlapIndex = 0
}: AbsoluteAppointmentCardProps) => {
  const top = calculateAppointmentTop(appointment.start_time, dayStartTime);
  const height = calculateAppointmentHeight(appointment.start_time, appointment.end_time);
  
  // Calculate width and left position for overlapping appointments
  const width = `${(100 / overlapping) - 2}%`;
  const left = `${(overlapIndex * (100 / overlapping)) + 1}%`;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/90 text-white';
      case 'scheduled':
        return 'bg-blue-500/90 text-white';
      case 'cancelled':
        return 'bg-red-500/90 text-white';
      case 'completed':
        return 'bg-gray-500/90 text-white';
      default:
        return 'bg-blue-500/90 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'scheduled':
        return 'Agendado';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  return (
    <div
      className={`
        absolute rounded-md border cursor-pointer transition-all hover:shadow-lg hover:z-50
        ${getStatusColor(appointment.status)}
        overflow-hidden
      `}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left,
        width,
        minHeight: '20px',
        borderLeftWidth: '4px',
        borderLeftColor: barberColor
      }}
      onClick={onClick}
    >
      <div className="p-1 h-full flex flex-col text-xs">
        {/* Time and status */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="font-medium">{appointment.start_time}</span>
          </div>
          {height > 30 && (
            <Badge variant="secondary" className="text-xs px-1 py-0 h-4 bg-white/20">
              {getStatusText(appointment.status)}
            </Badge>
          )}
        </div>

        {/* Client name */}
        {appointment.client && height > 25 && (
          <div className="flex items-center gap-1 mb-1">
            <User className="h-3 w-3" />
            <span className="font-semibold truncate">
              {appointment.client.name}
            </span>
          </div>
        )}

        {/* Service name */}
        {appointment.service && height > 40 && (
          <div className="flex items-center gap-1 mb-1">
            <Scissors className="h-3 w-3" />
            <span className="truncate">{appointment.service.name}</span>
          </div>
        )}

        {/* Price */}
        {appointment.total_price && height > 55 && (
          <div className="font-bold mt-auto">
            R$ {appointment.total_price.toFixed(2)}
          </div>
        )}

        {/* Duration indicator for small cards */}
        {height <= 25 && appointment.service && (
          <div className="text-xs opacity-80">
            {appointment.service.duration_minutes}min
          </div>
        )}
      </div>
    </div>
  );
};