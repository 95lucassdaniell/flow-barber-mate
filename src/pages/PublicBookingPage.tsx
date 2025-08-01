import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PhoneAuthProvider } from '@/hooks/usePhoneAuth';
import { PhoneLogin } from '@/components/booking/PhoneLogin';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { useBarbershopBySlug } from '@/hooks/useBarbershopBySlug';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { Scissors, Calendar, Star, Clock } from 'lucide-react';

const PublicBookingContent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, client, barbershop } = usePhoneAuth();
  const { barbershop: barbershopData, loading: isLoading } = useBarbershopBySlug(slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto"></div>
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!barbershopData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Scissors className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold">Barbearia não encontrada</h2>
              <p className="text-muted-foreground">
                Verifique o link e tente novamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            {barbershopData.logo_url ? (
              <img 
                src={barbershopData.logo_url} 
                alt={barbershopData.name}
                className="w-20 h-20 rounded-full mx-auto border-4 border-white/20"
              />
            ) : (
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Scissors className="w-10 h-10" />
              </div>
            )}
            
            <div>
              <h1 className="text-2xl font-bold">{barbershopData.name}</h1>
              <p className="text-primary-foreground/80">Agendamento Online</p>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Fácil</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Rápido</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>Seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {!isAuthenticated ? (
          <PhoneLogin 
            barbershopSlug={slug || ''} 
            onSuccess={() => {}} 
          />
        ) : (
          <BookingFlow />
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 px-4 text-muted-foreground text-sm">
        <p>Agendamento seguro via WhatsApp</p>
      </div>
    </div>
  );
};

export const PublicBookingPage = () => {
  return (
    <LoadingProvider>
      <PhoneAuthProvider>
        <PublicBookingContent />
      </PhoneAuthProvider>
    </LoadingProvider>
  );
};