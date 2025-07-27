import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requiresRole?: 'admin' | 'receptionist' | 'barber';
}

const ProtectedRoute = ({ children, requiresRole }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authValidating, setAuthValidating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Save current location to redirect back after login
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
    }
  }, [user, loading, navigate, location]);

  // Validate auth connection when user and profile are available
  useEffect(() => {
    const validateAuth = async () => {
      if (!loading && user && profile) {
        setAuthValidating(true);
        
        try {
          // Test if auth.uid() works by calling a simple RPC
          const { data, error } = await supabase.rpc('get_user_barbershop_id');
          
          if (error) {
            console.error('ProtectedRoute: Auth validation failed', error);
            // Force refresh and redirect to login
            await supabase.auth.signOut();
            navigate('/login', { 
              state: { from: location.pathname, message: 'Sessão expirada. Por favor, faça login novamente.' },
              replace: true 
            });
            return;
          }
          
          console.log('ProtectedRoute: Auth validation successful');
          
          // Check role requirements
          if (requiresRole) {
            const hasRequiredRole = profile.role === requiresRole || 
              (requiresRole === 'receptionist' && profile.role === 'admin');
            
            if (!hasRequiredRole) {
              navigate('/dashboard', { replace: true });
            }
          }
        } catch (error) {
          console.error('ProtectedRoute: Auth validation error', error);
          await supabase.auth.signOut();
          navigate('/login', { 
            state: { from: location.pathname, message: 'Erro de autenticação. Tente novamente.' },
            replace: true 
          });
        } finally {
          setAuthValidating(false);
        }
      }
    };

    validateAuth();
  }, [user, profile, loading, requiresRole, navigate, location]);

  // Show loading while checking authentication or validating
  if (loading || authValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-lg font-medium">Verificando autenticação...</div>
              <p className="text-sm text-muted-foreground text-center">
                Por favor, aguarde enquanto verificamos suas credenciais.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  // Don't render if user doesn't have required role
  if (requiresRole && profile) {
    const hasRequiredRole = profile.role === requiresRole || 
      (requiresRole === 'receptionist' && profile.role === 'admin');
    
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;