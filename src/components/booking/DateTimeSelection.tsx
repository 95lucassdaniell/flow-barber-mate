import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { format, addDays, isSameDay, isToday, isBefore } from 'date-fns';
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
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  console.log('📅 DateTimeSelection props:', { serviceId, barberId, barbershopId, selectedDate, selectedTime });
  
  // Early validation
  if (!barbershopId) {
    console.warn('⚠️ DateTimeSelection: barbershopId is empty or undefined');
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Carregando...</h2>
          <p className="text-muted-foreground">Aguarde um momento</p>
        </div>
      </div>
    );
  }
  
  const { getAvailableTimeSlots } = useBookingAvailability(barbershopId);

  // Generate next 7 days starting from today
  const availableDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    if (selectedDate && serviceId && barbershopId) {
      console.log('🔄 DateTimeSelection useEffect triggered:', { selectedDate, serviceId, barberId, barbershopId });
      loadAvailableSlots(selectedDate);
    } else {
      console.log('⚠️ DateTimeSelection useEffect: missing required data:', { 
        hasSelectedDate: !!selectedDate, 
        hasServiceId: !!serviceId, 
        hasBarbershopId: !!barbershopId 
      });
    }
  }, [selectedDate, serviceId, barberId, barbershopId]);

  const loadAvailableSlots = async (date: Date) => {
    console.log('🔄 Loading slots for date:', date, 'serviceId:', serviceId, 'barberId:', barberId);
    setIsLoadingSlots(true);
    try {
      const slots = await getAvailableTimeSlots(
        date, 
        serviceId, 
        barberId === 'any' ? undefined : barberId
      );
      console.log('📊 Slots received:', slots);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('❌ Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    console.log('📅 Date selected:', date);
    onSelect(date, ''); // Update parent state with selected date
    loadAvailableSlots(date);
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      onSelect(selectedDate, time);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Escolha data e horário</h2>
        <p className="text-muted-foreground">Selecione o dia e horário preferido</p>
      </div>

      {/* Day Selection - Horizontal Cards */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-muted-foreground">Selecione o dia</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableDays.map((date) => {
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isPast = isBefore(date, new Date()) && !isToday(date);
            
            return (
              <Card
                key={date.toISOString()}
                className={`min-w-[80px] cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 
                  isPast ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:bg-muted/50'
                }`}
                onClick={() => !isPast && handleDateSelect(date)}
              >
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {format(date, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-semibold ${isSelected ? 'text-primary' : ''}`}>
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
      </div>

      {/* Time Slots - Cards Grid */}
      {selectedDate && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Horários disponíveis</span>
          </div>

          {isLoadingSlots ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground">Carregando horários...</p>
              </div>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableSlots.map((time) => {
                const isSelected = time === selectedTime;
                
                return (
                  <Card
                    key={time}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary bg-primary text-primary-foreground' : 
                      'hover:shadow-md hover:bg-muted/50'
                    }`}
                    onClick={() => handleTimeSelect(time)}
                  >
                    <CardContent className="p-3 text-center">
                      <div className={`font-semibold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                        {time}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Não há horários disponíveis para este dia
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectedDate && loadAvailableSlots(selectedDate)}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};