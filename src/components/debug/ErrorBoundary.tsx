import React, { Component, ErrorInfo, ReactNode } from 'react';
import EmergencyStopUI from './EmergencyStopUI';

import { CacheManager } from '@/utils/cacheManager';

// Função para limpar cache NFe
const clearNfeCache = () => {
  return CacheManager.clearAllCaches();
};

// Função para resetar a aplicação
const resetApplicationState = () => {
  CacheManager.emergencyReset();
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary details:', {
      error: error.message,
      stack: error.stack,
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      location: window.location.href
    });

    // Verificar se o erro está relacionado a cancel-nfe
    if (error.message.includes('cancel-nfe') || 
        error.stack?.includes('cancel-nfe') ||
        error.message.includes('FunctionsHttpError')) {
      console.error('🚨 Detected cancel-nfe or Functions error - clearing cache and resetting');
      
      // Limpar cache imediatamente
      clearNfeCache();
      
      // Mostrar UI de emergência
      setTimeout(() => {
        resetApplicationState();
      }, 2000);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <>
          <EmergencyStopUI />
          {this.props.fallback || (
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-center p-6 max-w-md">
                <h2 className="text-xl font-semibold text-destructive mb-2">
                  Erro Detectado
                </h2>
                <p className="text-muted-foreground mb-4">
                  Detectamos um erro relacionado a NFe. Limpando cache...
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={resetApplicationState}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 w-full"
                  >
                    🔄 Reset Completo
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 w-full"
                  >
                    🔃 Recarregar Página
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <EmergencyStopUI />
        {this.props.children}
      </>
    );
  }
}

export default ErrorBoundary;