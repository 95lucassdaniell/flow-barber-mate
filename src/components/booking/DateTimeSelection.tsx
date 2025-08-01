import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';

interface DateTimeSelectionProps {
  serviceId: string;
  barberId?: string;
  selectedDate?: Date;
  selectedTime?: string;
  onSelect: (date: Date, time: string) => void;
  barbershopId: string;
}

export const DateTimeSelection = ({
  serviceId,
  barberId,
  selectedDate,
  selectedTime,
  onSelect,
  barbershopId
}: DateTimeSelectionProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  const { getAvailableTimeSlots } = useBookingAvailability(barbershopId);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    if (selectedDate && serviceId) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, serviceId, barberId]);

  const loadAvailableSlots = async (date: Date) => {
    setIsLoadingSlots(true);
    try {
      const slots = await getAvailableTimeSlots(
        date, 
        serviceId, 
        barberId === 'any' ? undefined : barberId
      );
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    if (selectedTime) {
      onSelect(date, selectedTime);
    } else {
      loadAvailableSlots(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      onSelect(selectedDate, time);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const canGoPrevious = !isBefore(addDays(currentWeekStart, -7), startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Escolha data e horário</h2>
        <p className="text-muted-foreground">Selecione o dia e horário preferido</p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={goToPreviousWeek}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <span className="font-medium">
          {format(currentWeekStart, 'MMM yyyy', { locale: ptBR })}
        </span>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={goToNextWeek}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isPast = isBefore(date, new Date()) && !isToday(date);
          
          return (
            <Card
              key={date.toISOString()}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : 
                isPast ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
              }`}
              onClick={() => !isPast && handleDateSelect(date)}
            >
              <CardContent className="p-2 text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  {format(date, 'EEE', { locale: ptBR })}
                </div>
                <div className={`text-sm font-medium ${isSelected ? 'text-primary' : ''}`}>
                  {format(date, 'd')}
                </div>
                {isToday(date) && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Hoje
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Horários disponíveis</span>
          </div>

          {isLoadingSlots ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Carregando horários...</p>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((time) => {
                const isSelected = time === selectedTime;
                
                return (
                  <Button
                    key={time}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleTimeSelect(time)}
                    className="h-10"
                  >
                    {time}
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                Não há horários disponíveis para este dia
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};