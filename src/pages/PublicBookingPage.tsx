import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PhoneAuthProvider } from '@/hooks/usePhoneAuth';
import { PhoneLogin } from '@/components/booking/PhoneLogin';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';

import { Card, CardContent } from '@/components/ui/card';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { Scissors, Calendar, Star, Clock } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { RobustSlugValidator } from '@/components/booking/RobustSlugValidator';
import { useEnvironmentDetection } from '@/components/booking/EnvironmentDetector';

const PublicBookingContent = ({ barbershopData }: { barbershopData: any }) => {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, client, barbershop, validateSession, isLoading: authLoading } = usePhoneAuth();
  const [initialized, setInitialized] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const envInfo = useEnvironmentDetection();

  useEffect(() => {
    const checkSession = async () => {
      // Check for session_id in URL
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId && !sessionChecked) {
        console.log('🔑 Session ID detected in URL:', sessionId);
        setSessionChecked(true);
        
        const success = await validateSession(sessionId);
        if (success) {
          // Remove session_id from URL
          urlParams.delete('session_id');
          const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
          console.log('✅ Session authenticated, URL cleaned');
        }
      } else {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, [validateSession, sessionChecked]);

  useEffect(() => {
    // Debug logs for production
    const isMobile = window.innerWidth <= 768;
    console.log('🔄 PublicBookingPage mounted:', {
      slug,
      href: window.location.href,
      pathname: window.location.pathname,
      barbershop: barbershopData?.name,
      isAuthenticated,
      userAgent: navigator.userAgent,
      documentReadyState: document.readyState,
      environment: envInfo,
      isMobile,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      connection: (navigator as any)?.connection?.effectiveType
    });

    // Ensure DOM is ready
    const initializeApp = () => {
      if (document.readyState === 'complete' && sessionChecked) {
        setInitialized(true);
        console.log('✅ App initialized successfully');
      } else {
        setTimeout(initializeApp, 100);
      }
    };

    initializeApp();
  }, [slug, barbershopData, isAuthenticated, sessionChecked]);

  if (!initialized || !sessionChecked) {
    const loadingMessage = !sessionChecked ? 'Verificando autenticação...' : 'Carregando...';
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto"></div>
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-4">{loadingMessage}</p>
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
      <div className="bg-muted text-foreground">
        <div className="max-w-md mx-auto px-4 py-4 md:py-8">
          <div className="text-center space-y-4">
            {barbershopData.logo_url ? (
              <img 
                src={barbershopData.logo_url} 
                alt={barbershopData.name}
                className="w-32 h-32 rounded-full mx-auto border-4 border-white/20"
              />
            ) : (
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <Scissors className="w-16 h-16" />
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
      <div className="max-w-md mx-auto px-4 py-3 md:py-6">
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
  const [detectedSlug, setDetectedSlug] = useState<string>('');

  useEffect(() => {
    // Extract slug from either /:slug/agendamento or /app/:slug/agendamento
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/').filter(Boolean);
    const slug = pathSegments[0] === 'app' ? pathSegments[1] : pathSegments[0];
    
    setDetectedSlug(slug);

    console.log('🚀 PublicBookingPage root mounted:', {
      location: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      origin: window.location.origin,
      protocol: window.location.protocol,
      host: window.location.host,
      timestamp: new Date().toISOString(),
      extractedSlug: slug,
      pathSegments
    });

    // Check for potential routing issues
    if (!slug || slug === 'agendamento') {
      console.warn('⚠️ Invalid slug detected:', { slug, currentPath, pathSegments });
    }
  }, []);

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Erro de Carregamento</h2>
          <p className="text-muted-foreground mb-4">
            Ocorreu um erro ao carregar a página de agendamento.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    }>
      <LoadingProvider>
        <PhoneAuthProvider>
          <RobustSlugValidator
            slug={detectedSlug}
            onValidated={(isValid, data) => {
              console.log('🔍 Slug validation result:', { 
                slug: detectedSlug, 
                isValid, 
                barbershopData: data 
              });
            }}
          >
            {(barbershopData) => <PublicBookingContent barbershopData={barbershopData} />}
          </RobustSlugValidator>
        </PhoneAuthProvider>
      </LoadingProvider>
    </ErrorBoundary>
  );
};