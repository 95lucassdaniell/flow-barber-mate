import { ReactNode, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AuthCheckProps {
  children: ReactNode;
  requiresAuth?: boolean;
  redirectPath?: string;
}

const AuthCheck = ({ 
  children, 
  requiresAuth = true, 
  redirectPath 
}: AuthCheckProps) => {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    if (!loading && requiresAuth) {
      if (!isAuthenticated || !user) {
        // Redirecionar para login específico da barbearia se slug disponível
        const loginPath = slug ? `/app/${slug}/login` : '/login';
        navigate(redirectPath || loginPath);
        return;
      }

      if (user && !profile) {
        // Aguardar profile carregar ou mostrar erro após timeout
        const timeout = setTimeout(() => {
          console.warn('Profile não carregou, redirecionando para login');
          navigate(redirectPath || '/login');
        }, 10000); // 10 segundos de timeout

        return () => clearTimeout(timeout);
      }

      if (user && profile && slug && profile.barbershop_id) {
        // Verificar se o usuário tem acesso a esta barbearia específica
        // Esta verificação será feita no ProtectedRoute, mas podemos adicionar aqui também
      }
    }
  }, [loading, isAuthenticated, user, profile, navigate, slug, requiresAuth, redirectPath]);

  if (!requiresAuth) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="font-semibold">Verificando autenticação</h3>
                <p className="text-sm text-muted-foreground">
                  Aguarde enquanto verificamos suas credenciais...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="font-semibold">Acesso Restrito</h3>
                <p className="text-sm text-muted-foreground">
                  Você precisa estar logado para acessar esta página.
                </p>
              </div>
              <Button 
                onClick={() => navigate(redirectPath || (slug ? `/app/${slug}/login` : '/login'))}
                className="w-full"
              >
                Fazer Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <div>
                <h3 className="font-semibold">Carregando perfil</h3>
                <p className="text-sm text-muted-foreground">
                  Aguarde enquanto carregamos suas informações...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthCheck;