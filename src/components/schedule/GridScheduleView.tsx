import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentBlock } from "./AppointmentBlock";
import { useBarbershopSettings } from "@/hooks/useBarbershopSettings";
import { SLOT_HEIGHT_PX, calculateSlotsCount, isTimeInRange } from "@/lib/utils";

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

interface Barber {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface GridScheduleViewProps {
  date: Date;
  barbers: Barber[];
  appointments: Appointment[];
  timeSlots: string[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (barberId: string, timeSlot: string) => void;
}

export const GridScheduleView = ({
  date,
  barbers,
  appointments,
  timeSlots,
  onAppointmentClick,
  onTimeSlotClick
}: GridScheduleViewProps) => {
  const [selectedBarbers, setSelectedBarbers] = useState<string[]>(
    barbers.map(b => b.id)
  );
  const { generateTimeSlots, isOpenOnDate } = useBarbershopSettings();

  const filteredBarbers = barbers.filter(b => selectedBarbers.includes(b.id));
  const dateString = format(date, 'yyyy-MM-dd');
  
  // Use barbershop settings for time slots (using default 15 min duration)
  const barbershopTimeSlots = generateTimeSlots(date, 15, 15);
  const isOpen = isOpenOnDate(date);

  // Calcular quantos slots um agendamento ocupa (baseado na duração)
  const getAppointmentSlotsCount = (appointment: Appointment): number => {
    const duration = appointment.service?.duration_minutes || 30;
    return calculateSlotsCount(duration);
  };

  // Verificar se um agendamento ocupa um slot específico
  const isAppointmentInSlot = (appointment: Appointment, timeSlot: string): boolean => {
    const normalizedStartTime = appointment.start_time.slice(0, 5);
    const normalizedEndTime = appointment.end_time.slice(0, 5);
    
    return isTimeInRange(timeSlot, normalizedStartTime, normalizedEndTime);
  };

  // Obter agendamento para um barbeiro e horário específico
  const getAppointmentForSlot = (barberId: string, timeSlot: string): Appointment | null => {
    return appointments.find(apt => 
      apt.barber_id === barberId &&
      apt.appointment_date === dateString &&
      apt.start_time === timeSlot
    ) || null;
  };

  // Verificar se um slot está ocupado por um agendamento que começou antes
  const isSlotOccupiedByPreviousAppointment = (barberId: string, timeSlot: string): Appointment | null => {
    return appointments.find(apt => 
      apt.barber_id === barberId &&
      apt.appointment_date === dateString &&
      apt.start_time !== timeSlot &&
      isAppointmentInSlot(apt, timeSlot)
    ) || null;
  };

  const handleBarberToggle = (barberId: string) => {
    setSelectedBarbers(prev => 
      prev.includes(barberId) 
        ? prev.filter(id => id !== barberId)
        : [...prev, barberId]
    );
  };

  const handleSelectAll = () => {
    setSelectedBarbers(barbers.map(b => b.id));
  };

  const handleUnselectAll = () => {
    setSelectedBarbers([]);
  };

  // Use barbershop time slots or provided ones
  const displaySlots = barbershopTimeSlots.length > 0 ? barbershopTimeSlots : (timeSlots || []);

  return (
    <div className="space-y-4">
      {/* Controles de Filtro */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros da Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Selecionar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={handleUnselectAll}>
                Desmarcar Todos
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {barbers.map(barber => (
                <div key={barber.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`barber-${barber.id}`}
                    checked={selectedBarbers.includes(barber.id)}
                    onCheckedChange={() => handleBarberToggle(barber.id)}
                  />
                  <label 
                    htmlFor={`barber-${barber.id}`}
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {barber.full_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {barber.full_name}
                    {barber.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">Admin</Badge>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid da Agenda */}
      <Card>
        <CardHeader>
          <CardTitle>
            Agenda do Dia - {format(date, "dd 'de' MMMM", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!isOpen ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">Barbearia Fechada</p>
                <p className="text-sm text-muted-foreground">A barbearia está fechada no dia selecionado.</p>
              </div>
            </div>
          ) : displaySlots.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">Sem Horários Disponíveis</p>
                <p className="text-sm text-muted-foreground">Não há horários disponíveis para agendamento hoje.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div 
                className="grid gap-0 border"
                style={{
                  gridTemplateColumns: `80px repeat(${filteredBarbers.length}, minmax(200px, 1fr))`,
                  minWidth: `${80 + filteredBarbers.length * 200}px`
                }}
              >
              {/* Cabeçalho */}
              <div className="p-2 border-b bg-muted font-medium text-center">
                Horário
              </div>
              {filteredBarbers.map(barber => (
                <div key={barber.id} className="p-2 border-b bg-muted">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {barber.full_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{barber.full_name}</div>
                      {barber.role === 'admin' && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Linhas de Horário */}
              {displaySlots.map(timeSlot => (
                <>
                  <div 
                    key={`time-${timeSlot}`} 
                    className="p-2 border-b border-r text-sm font-medium text-center bg-gray-50"
                  >
                    {timeSlot}
                  </div>
                  {filteredBarbers.map(barber => {
                    const appointment = getAppointmentForSlot(barber.id, timeSlot);
                    const occupiedByPrevious = isSlotOccupiedByPreviousAppointment(barber.id, timeSlot);
                    
                    return (
                      <div 
                        key={`${barber.id}-${timeSlot}`}
                        className="border-b border-r relative"
                        style={{ minHeight: `${SLOT_HEIGHT_PX}px` }}
                      >
                        {appointment ? (
                          <AppointmentBlock
                            appointment={appointment}
                            onClick={() => onAppointmentClick?.(appointment)}
                            slotsCount={getAppointmentSlotsCount(appointment)}
                          />
                        ) : occupiedByPrevious ? (
                          <div className="h-full bg-gray-100 opacity-50" />
                        ) : (
                          <div 
                            className="h-full hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-center"
                            onClick={() => onTimeSlotClick?.(barber.id, timeSlot)}
                          >
                            <Plus className="h-4 w-4 text-muted-foreground opacity-0 hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};