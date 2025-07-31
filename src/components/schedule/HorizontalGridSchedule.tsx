import { BarberColumn } from "./BarberColumn";
import { TimeColumn } from "./TimeColumn";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useState } from "react";

import { Appointment, Barber } from "@/types/appointment";

interface HorizontalGridScheduleProps {
  date: Date;
  barbers: Barber[];
  appointments: Appointment[];
  timeSlots: string[];
  onTimeSlotClick: (barberId: string, timeSlot: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

const BARBER_COLORS = [
  '#3B82F6', // azul
  '#10B981', // verde
  '#8B5CF6', // roxo
  '#F59E0B', // laranja
  '#EF4444', // vermelho
  '#06B6D4', // ciano
  '#84CC16', // lime
  '#F97316', // orange
];

export const HorizontalGridSchedule = ({
  date,
  barbers,
  appointments,
  timeSlots,
  onTimeSlotClick,
  onAppointmentClick
}: HorizontalGridScheduleProps) => {
  const [selectedBarbers, setSelectedBarbers] = useState<string[]>(
    barbers.map(b => b.id)
  );

  const getBarberColor = (barberId: string, index: number): string => {
    return BARBER_COLORS[index % BARBER_COLORS.length];
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

  const filteredBarbers = barbers.filter(barber => 
    selectedBarbers.includes(barber.id)
  );

  return (
    <div className="space-y-4">
      {/* Filtros de barbeiros */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Barbeiros</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 px-2 text-xs"
            >
              Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnselectAll}
              className="h-7 px-2 text-xs"
            >
              Nenhum
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          {barbers.map((barber, index) => (
            <div key={barber.id} className="flex items-center space-x-2">
              <Checkbox
                id={barber.id}
                checked={selectedBarbers.includes(barber.id)}
                onCheckedChange={() => handleBarberToggle(barber.id)}
              />
              <label
                htmlFor={barber.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getBarberColor(barber.id, index) }}
                />
                {barber.full_name}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Grid de agendamentos */}
      {filteredBarbers.length > 0 ? (
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <div 
            className="grid"
            style={{
              gridTemplateColumns: `120px repeat(${filteredBarbers.length}, minmax(200px, 1fr))`
            }}
          >
            <TimeColumn timeSlots={timeSlots} />
            {filteredBarbers.map((barber, index) => {
              const originalIndex = barbers.findIndex(b => b.id === barber.id);
              return (
                <BarberColumn
                  key={barber.id}
                  barber={barber}
                  timeSlots={timeSlots}
                  appointments={appointments.filter(apt => apt.barber_id === barber.id)}
                  barberColor={getBarberColor(barber.id, originalIndex)}
                  onTimeSlotClick={onTimeSlotClick}
                  onAppointmentClick={onAppointmentClick}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Selecione pelo menos um barbeiro para visualizar a agenda.
          </p>
        </Card>
      )}
    </div>
  );
};