import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TimeColumn } from "./TimeColumn";
import { NewBarberColumn } from "./NewBarberColumn";
import { useBarbershopSettings } from "@/hooks/useBarbershopSettings";
import { generateTimeSlots } from "@/lib/utils";
import { Appointment, Barber } from "@/types/appointment";

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
  const { settings, isOpenOnDate } = useBarbershopSettings();

  const filteredBarbers = barbers.filter(b => selectedBarbers.includes(b.id));
  const isOpen = isOpenOnDate(date);

  // Get operating hours from settings
  const openTime = "08:00"; // Use default for now
  const closeTime = "18:00"; // Use default for now
  
  // Generate hourly time slots for the day
  const hourlyTimeSlots = generateTimeSlots(openTime, closeTime);

  // Define barber colors
  const barberColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  const getBarberColor = (index: number) => {
    return barberColors[index % barberColors.length];
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
              {barbers.map((barber, index) => (
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
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getBarberColor(index) }}
                    />
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

      {/* Grid da Agenda Estilo Google Calendar */}
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
          ) : filteredBarbers.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">Nenhum Barbeiro Selecionado</p>
                <p className="text-sm text-muted-foreground">Selecione pelo menos um barbeiro para visualizar a agenda.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex border-t">
                {/* Time column */}
                <TimeColumn timeSlots={hourlyTimeSlots} />
                
                {/* Barber columns */}
                {filteredBarbers.map((barber, index) => (
                  <NewBarberColumn
                    key={barber.id}
                    barber={barber}
                    appointments={appointments}
                    barberColor={getBarberColor(index)}
                    timeSlots={hourlyTimeSlots}
                    dayStartTime={openTime}
                    dayEndTime={closeTime}
                    onAppointmentClick={onAppointmentClick!}
                    onTimeSlotClick={onTimeSlotClick!}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};