import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const DashboardRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.error('🚨 Usuário acessou rota inválida /dashboard - redirecionando para /app');
    
    // Tenta redirecionar para uma rota válida
    const timeout = setTimeout(() => {
      navigate('/app', { replace: true });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-destructive">Rota Inválida</h1>
        <p className="text-muted-foreground mb-6">
          A rota /dashboard não existe. Você será redirecionado automaticamente.
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/app">Ir para o App</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/login">Fazer Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardRedirect;