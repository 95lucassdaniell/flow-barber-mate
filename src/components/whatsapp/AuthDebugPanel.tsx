import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AuthDebugPanel: React.FC = () => {
  const { user, profile, session, loading, authError, isAuthenticated } = useAuth();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Debug de Autenticação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Status Geral</label>
            <div className="flex items-center gap-2 mt-1">
              {isAuthenticated ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Autenticado
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive">Não autenticado</Badge>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Loading</label>
            <div className="flex items-center gap-2 mt-1">
              {loading ? (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  Carregando...
                </Badge>
              ) : (
                <Badge variant="outline">Finalizado</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium">User ID</label>
            <p className="text-sm text-muted-foreground font-mono">
              {user?.id || 'Nenhum'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Session ID</label>
            <p className="text-sm text-muted-foreground font-mono">
              {session?.access_token ? 
                `${session.access_token.substring(0, 20)}...` : 
                'Nenhum'
              }
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Profile ID</label>
            <p className="text-sm text-muted-foreground font-mono">
              {profile?.id || 'Nenhum'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Barbershop ID</label>
            <p className="text-sm text-muted-foreground font-mono">
              {profile?.barbershop_id || 'Nenhum'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Role</label>
            <p className="text-sm text-muted-foreground">
              {profile?.role || 'Nenhum'}
            </p>
          </div>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 font-medium">Erro de Auth:</p>
            <p className="text-sm text-red-600">{authError}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>💡 Se houver problemas:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Verifique se User ID e Session ID existem</li>
            <li>Confirme se Profile ID está preenchido</li>
            <li>Barbershop ID é necessário para acessar conversas</li>
            <li>Role deve ser admin, receptionist ou barber</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthDebugPanel;