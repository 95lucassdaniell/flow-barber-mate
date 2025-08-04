import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    if (error.message.includes('cancel-nfe') || error.stack?.includes('cancel-nfe')) {
      console.error('🚨 Detected cancel-nfe error - clearing potential cached data');
      
      // Limpar possíveis dados em cache que podem estar causando o problema
      try {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        
        // Forçar reload da página após limpar cache
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-6 max-w-md">
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Algo deu errado
            </h2>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro inesperado. Limpando cache e recarregando...
            </p>
            <button 
              onClick={() => {
                // Limpar cache e recarregar
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Limpar Cache e Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;