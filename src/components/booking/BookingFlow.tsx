import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, User, Scissors } from 'lucide-react';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { ServiceSelection } from './ServiceSelection';
import { BarberSelection } from './BarberSelection';
import { DateTimeSelection } from './DateTimeSelection';
import { BookingConfirmation } from './BookingConfirmation';

interface BookingStep {
  id: 'service' | 'barber' | 'datetime' | 'confirmation';
  title: string;
  icon: React.ReactNode;
}

const steps: BookingStep[] = [
  { id: 'service', title: 'Serviço', icon: <Scissors className="w-4 h-4" /> },
  { id: 'barber', title: 'Barbeiro', icon: <User className="w-4 h-4" /> },
  { id: 'datetime', title: 'Data e Hora', icon: <Calendar className="w-4 h-4" /> },
  { id: 'confirmation', title: 'Confirmar', icon: <Check className="w-4 h-4" /> },
];

interface BookingData {
  serviceId?: string;
  barberId?: string;
  date?: Date;
  time?: string;
  price?: number;
}

export const BookingFlow = () => {
  const [currentStep, setCurrentStep] = useState<'service' | 'barber' | 'datetime' | 'confirmation'>('service');
  const [bookingData, setBookingData] = useState<BookingData>({});
  
  const { client, barbershop } = usePhoneAuth();
  const { services, providers, getAvailableProviders, getServicePrice, isLoading, error } = useBookingAvailability(barbershop?.id || '');
  
  console.log('📋 BookingFlow state:', { 
    currentStep, 
    barbershopId: barbershop?.id, 
    hasBarbershop: !!barbershop, 
    isLoading,
    servicesCount: services.length,
    providersCount: providers.length
  });

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  
  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return !!bookingData.serviceId;
      case 'barber':
        return !!bookingData.barberId;
      case 'datetime':
        return !!bookingData.date && !!bookingData.time;
      case 'confirmation':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id);
    }
  };

  const handleBack = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  };

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const getSelectedService = () => services.find(s => s.id === bookingData.serviceId);
  const getSelectedBarber = () => providers.find(p => p.id === bookingData.barberId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold">{barbershop?.name}</h1>
              <p className="text-sm text-muted-foreground">
                Olá, {client?.name || 'Cliente'}!
              </p>
            </div>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = getCurrentStepIndex() > index;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
                    ${isActive ? 'bg-primary text-primary-foreground' : 
                      isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
                  `}>
                    {isCompleted ? <Check className="w-4 h-4" /> : step.icon}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-2 text-center">
            <span className="text-sm font-medium">{steps[getCurrentStepIndex()].title}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando serviços...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-8 space-y-4">
            <div className="text-destructive">
              <p className="text-lg font-medium">Erro ao carregar dados</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mx-auto"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Service Selection Step */}
        {currentStep === 'service' && !isLoading && !error && (
          <ServiceSelection
            services={services}
            selectedServiceId={bookingData.serviceId}
            onSelect={(serviceId) => {
              updateBookingData({ 
                serviceId, 
                barberId: undefined, // Reset barber when service changes
                price: getServicePrice(serviceId)
              });
            }}
          />
        )}

        {currentStep === 'barber' && bookingData.serviceId && (
          <BarberSelection
            providers={getAvailableProviders(bookingData.serviceId)}
            selectedBarberId={bookingData.barberId}
            serviceId={bookingData.serviceId}
            onSelect={(barberId) => {
              updateBookingData({ 
                barberId,
                price: getServicePrice(bookingData.serviceId!, barberId)
              });
            }}
            getServicePrice={getServicePrice}
          />
        )}

        {currentStep === 'datetime' && bookingData.serviceId && (
          <>
            {!barbershop?.id ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando dados da barbearia...</p>
              </div>
            ) : (
              <DateTimeSelection
                serviceId={bookingData.serviceId}
                barberId={bookingData.barberId}
                selectedDate={bookingData.date}
                selectedTime={bookingData.time}
                onSelect={(date, time) => updateBookingData({ date, time })}
                barbershopId={barbershop.id}
              />
            )}
          </>
        )}

        {currentStep === 'confirmation' && (
          <BookingConfirmation
            bookingData={bookingData}
            service={getSelectedService()}
            barber={getSelectedBarber()}
            client={client}
            barbershop={barbershop}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-md mx-auto flex gap-3">
          {getCurrentStepIndex() > 0 && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          
          {currentStep !== 'confirmation' && (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};