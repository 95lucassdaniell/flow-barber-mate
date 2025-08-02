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
      location: window.location.href,
      railwayEnv: window.location.hostname.includes('railway') ? 'Railway' : 'Other'
    });
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
              Ocorreu um erro inesperado. {window.location.hostname.includes('railway') && 'Detectamos que você está no Railway. '} Tente recarregar a página.
            </p>
            {window.location.hostname.includes('railway') && (
              <p className="text-xs text-muted-foreground mb-4">
                Se o problema persistir, pode ser uma limitação temporária do servidor.
              </p>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;