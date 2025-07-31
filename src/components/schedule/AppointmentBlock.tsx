import { Badge } from "@/components/ui/badge";
import { Clock, User, Scissors, Phone } from "lucide-react";
import { calculateAppointmentHeight, calculateAppointmentTop } from "@/lib/utils";

interface Appointment {
  id: string;
  barbershop_id: string;
  client_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
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

interface AppointmentBlockProps {
  appointment: Appointment;
  onClick?: () => void;
  slotsCount?: number;
}

export const AppointmentBlock = ({ appointment, onClick, slotsCount }: AppointmentBlockProps) => {
  // Calculate slots based on service duration if not provided
  const actualSlotsCount = slotsCount || 1;
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'completed':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
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
        relative p-2 rounded-md border-l-4 cursor-pointer transition-all hover:shadow-md
        ${getStatusColor(appointment.status)}
      `}
      style={{
        minHeight: `60px`,
        zIndex: actualSlotsCount > 1 ? 10 : 1
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span className="text-xs font-medium">{appointment.start_time}</span>
        </div>
        <Badge variant="outline" className="text-xs px-1 py-0">
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

      {appointment.client?.phone && (
        <div className="flex items-center gap-1 mb-1">
          <Phone className="h-3 w-3" />
          <span className="text-xs">{appointment.client.phone}</span>
        </div>
      )}

      {appointment.total_price && (
        <div className="text-xs font-bold text-right">
          R$ {appointment.total_price.toFixed(2)}
        </div>
      )}

      {actualSlotsCount > 1 && (
        <div className="absolute bottom-1 left-1 text-xs opacity-60">
          {appointment.service?.duration_minutes || actualSlotsCount * 15}min
        </div>
      )}
    </div>
  );
};