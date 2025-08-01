import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, Scissors, MapPin, Phone, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface BookingConfirmationProps {
  bookingData: any;
  service: any;
  barber: any;
  client: any;
  barbershop: any;
}

export const BookingConfirmation = ({ 
  bookingData, 
  service, 
  barber, 
  client, 
  barbershop 
}: BookingConfirmationProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate end time
      const startTime = new Date(`2000-01-01 ${bookingData.time}:00`);
      const endTime = new Date(startTime.getTime() + (service?.duration_minutes || 30) * 60000);
      const endTimeString = format(endTime, 'HH:mm');

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: barbershop.id,
          client_id: client.id,
          barber_id: bookingData.barberId === 'any' ? null : bookingData.barberId,
          service_id: bookingData.serviceId,
          appointment_date: format(bookingData.date, 'yyyy-MM-dd'),
          start_time: bookingData.time,
          end_time: endTimeString,
          total_price: bookingData.price || 0,
          status: 'scheduled'
        });

      if (appointmentError) throw appointmentError;

      setIsConfirmed(true);
    } catch (error: any) {
      setError(error.message || 'Erro ao confirmar agendamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isConfirmed) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-green-600">Agendamento Confirmado!</h2>
        <p className="text-muted-foreground">
          Seu agendamento foi realizado com sucesso. Você receberá uma confirmação via WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Confirmar agendamento</h2>
        <p className="text-muted-foreground">Revise os detalhes do seu agendamento</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Scissors className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">{service?.name}</p>
              <p className="text-sm text-muted-foreground">{service?.duration_minutes} min</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">
                {bookingData.barberId === 'any' ? 'Qualquer barbeiro' : barber?.full_name}
              </p>
              <p className="text-sm text-muted-foreground">Barbeiro</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">
                {format(bookingData.date, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">Data</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium">{bookingData.time}</p>
              <p className="text-sm text-muted-foreground">Horário</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total:</span>
              <Badge variant="secondary" className="text-lg">
                R$ {bookingData.price?.toFixed(2) || '0,00'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}
      </Button>
    </div>
  );
};