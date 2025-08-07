import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, RefreshCw, Loader2, AlertTriangle } from "lucide-react";

interface WhatsAppConnectionStatusProps {
  connectionStatus: 'checking' | 'connected' | 'disconnected' | 'error';
  onReconnect: () => void;
  loading?: boolean;
}

export const WhatsAppConnectionStatus = ({ 
  connectionStatus, 
  onReconnect, 
  loading = false 
}: WhatsAppConnectionStatusProps) => {
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4" />,
          badge: "connected",
          variant: "default" as const,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          title: "WhatsApp Conectado",
          description: "Pronto para receber e enviar mensagens"
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          badge: "disconnected",
          variant: "secondary" as const,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          title: "WhatsApp Desconectado",
          description: "Configure a conexão para receber mensagens"
        };
      case 'error':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          badge: "error",
          variant: "destructive" as const,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          title: "Erro na Conexão",
          description: "Tente reconectar ou verifique as configurações"
        };
      case 'checking':
      default:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          badge: "checking",
          variant: "outline" as const,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          title: "Verificando Conexão",
          description: "Aguarde enquanto verificamos o status"
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className={statusInfo.color}>
              {statusInfo.icon}
            </span>
            {statusInfo.title}
          </CardTitle>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            {statusInfo.icon}
            {statusInfo.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className={`${statusInfo.bgColor} border-0`}>
          <AlertDescription>
            {statusInfo.description}
          </AlertDescription>
        </Alert>

        {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
          <div className="mt-4 space-y-2">
            <Button 
              onClick={onReconnect} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reconectando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reconectar WhatsApp
                </>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground text-center">
              Se o problema persistir, verifique as configurações na aba "Conexão"
            </div>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground text-center">
              ✅ Sistema funcionando normalmente
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppConnectionStatus;