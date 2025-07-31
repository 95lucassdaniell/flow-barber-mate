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
        state: { from: location.pathname }
      });
    }
  }, [user, loading, navigate, location]);

  // Simple role validation without RPC calls to prevent loops
  useEffect(() => {
    if (!loading && user && profile) {
      console.log('ProtectedRoute: Validating role for user', user.id, 'with role', profile.role);
      
      // Check role requirements
      if (requiresRole) {
        const hasRequiredRole = profile.role === requiresRole || 
          (requiresRole === 'receptionist' && profile.role === 'admin');
        
        if (!hasRequiredRole) {
          console.warn('ProtectedRoute: Insufficient role, redirecting to login');
          navigate('/login');
        }
      }
    }
  }, [user, profile, loading, requiresRole, navigate, location]);

  // Show loading while checking authentication
  if (loading) {
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