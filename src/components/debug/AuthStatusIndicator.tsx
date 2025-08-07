import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw, LogOut } from "lucide-react";
import { globalState } from "@/lib/globalState";

export const AuthStatusIndicator = () => {
  const { user, profile, loading, authError, signOut } = useAuth();

  const handleReset = () => {
    console.log('🔄 Reset manual do sistema');
    globalState.fullReset();
    localStorage.clear();
    window.location.reload();
  };

  const getBadgeVariant = () => {
    if (loading) return "secondary";
    if (authError) return "destructive";
    if (user && profile) return "default";
    return "outline";
  };

  const getStatusText = () => {
    if (loading) return "Carregando...";
    if (authError) return `Erro: ${authError}`;
    if (user && profile) return "Autenticado";
    if (user && !profile) return "Sem perfil";
    return "Não autenticado";
  };

  const getIcon = () => {
    if (loading) return <RefreshCw className="w-3 h-3 animate-spin" />;
    if (authError) return <AlertCircle className="w-3 h-3" />;
    if (user && profile) return <CheckCircle className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-64">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Auth Status
          <Badge variant={getBadgeVariant()} className="text-xs">
            {getIcon()}
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs space-y-1 text-muted-foreground">
          <div>User: {user?.id?.slice(0, 8) || 'N/A'}</div>
          <div>Profile: {profile?.id?.slice(0, 8) || 'N/A'}</div>
          <div>Barbershop: {profile?.barbershop_id?.slice(0, 8) || 'N/A'}</div>
          <div>Role: {profile?.role || 'N/A'}</div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          {user && (
            <Button size="sm" variant="outline" onClick={signOut}>
              <LogOut className="w-3 h-3 mr-1" />
              Sair
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};