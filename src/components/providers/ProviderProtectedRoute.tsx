import { ReactNode, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProviderAuth } from '@/hooks/useProviderAuth';
import { Loader2 } from 'lucide-react';

interface ProviderProtectedRouteProps {
  children: ReactNode;
}

const ProviderProtectedRoute = ({ children }: ProviderProtectedRouteProps) => {
  const { user, profile, loading, isProvider, mustChangePassword } = useProviderAuth();
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    if (!loading) {
      if (!user || !isProvider || !profile) {
        navigate(`/provider/${slug}/login`);
        return;
      }

      if (mustChangePassword) {
        navigate(`/provider/${slug}/change-password`);
        return;
      }
    }
  }, [loading, user, isProvider, profile, mustChangePassword, navigate, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user || !isProvider || !profile) {
    return null;
  }

  if (mustChangePassword) {
    return null;
  }

  return <>{children}</>;
};

export default ProviderProtectedRoute;