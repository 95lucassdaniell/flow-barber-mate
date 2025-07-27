import { Badge } from "@/components/ui/badge";
import { Clock, User, Scissors, Phone } from "lucide-react";

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

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: () => void;
  slotsCount?: number;
  barberColor: string;
}

export const AppointmentCard = ({ 
  appointment, 
  onClick, 
  slotsCount = 1, 
  barberColor 
}: AppointmentCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 border-green-500/20 text-green-700';
      case 'scheduled':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700';
      case 'cancelled':
        return 'bg-red-500/10 border-red-500/20 text-red-700';
      case 'completed':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-700';
      default:
        return 'bg-muted border-border text-foreground';
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
        relative p-2 rounded-md border cursor-pointer transition-all hover:shadow-sm
        ${getStatusColor(appointment.status)}
      `}
      style={{
        minHeight: `${slotsCount * 40}px`,
        borderLeftWidth: '3px',
        borderLeftColor: barberColor
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span className="text-xs font-medium">{appointment.start_time}</span>
        </div>
        <Badge variant="outline" className="text-xs px-1 py-0 h-5">
          {getStatusText(appointment.status)}
        </Badge>
      </div>

      {appointment.client && (
        <div className="flex items-center gap-1 mb-1">
          <User className="h-3 w-3" />
          <span className="text-xs font-semibold truncate">
            {appointment.client.name}
          </span>
        </div>
      )}

      {appointment.service && (
        <div className="flex items-center gap-1 mb-1">
          <Scissors className="h-3 w-3" />
          <span className="text-xs truncate">{appointment.service.name}</span>
        </div>
      )}

      {appointment.total_price && (
        <div className="text-xs font-bold text-right">
          R$ {appointment.total_price.toFixed(2)}
        </div>
      )}

      {slotsCount > 1 && (
        <div className="absolute bottom-1 left-1 text-xs opacity-60">
          {slotsCount * 15}min
        </div>
      )}
    </div>
  );
};