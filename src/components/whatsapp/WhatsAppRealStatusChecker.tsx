import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Wifi, WifiOff, QrCode, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StatusCheckResult {
  instanceName: string;
  databaseStatus: string;
  realStatus: string;
  databasePhone: string | null;
  realPhone: string | null;
  statusMismatch: boolean;
  phoneMismatch: boolean;
  needsConnection: boolean;
  isGhostConnection: boolean;
  qrCode: string | null;
  recommendations: string[];
}

const WhatsAppRealStatusChecker = () => {
  const [loading, setLoading] = useState(false);
  const [forceConnecting, setForceConnecting] = useState(false);
  const [result, setResult] = useState<StatusCheckResult | null>(null);
  const [qrCodeForConnection, setQrCodeForConnection] = useState<string | null>(null);
  const { toast } = useToast();

  const checkRealStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-real-status-check');
      
      if (error) throw error;
      
      if (data.success) {
        setResult(data.data);
        toast({
          title: "Status verificado",
          description: "Verificação de status real concluída",
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao verificar status real:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar status real",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const forceConnection = async () => {
    setForceConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-force-connection');
      
      if (error) throw error;
      
      if (data.success) {
        setQrCodeForConnection(data.qrCode);
        toast({
          title: "Nova conexão iniciada",
          description: "QR Code gerado. Escaneie com seu WhatsApp.",
        });
        // Atualizar status após forçar conexão
        setTimeout(() => checkRealStatus(), 2000);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao forçar conexão:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao forçar nova conexão",
        variant: "destructive",
      });
    } finally {
      setForceConnecting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'open':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
      case 'close':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'connected':
      case 'open':
        return 'default' as const;
      case 'disconnected':
      case 'close':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Verificação de Status Real
        </CardTitle>
        <CardDescription>
          Verifica o status real da instância WhatsApp na Evolution API vs banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={checkRealStatus} 
            disabled={loading}
            variant="outline"
          >
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            Verificar Status Real
          </Button>
          
          {result?.needsConnection && (
            <Button 
              onClick={forceConnection} 
              disabled={forceConnecting}
              variant="default"
            >
              {forceConnecting && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Forçar Nova Conexão
            </Button>
          )}
        </div>

        {result && (
          <div className="space-y-4">
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Status no Banco</h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.databaseStatus)}
                  <Badge variant={getStatusVariant(result.databaseStatus)}>
                    {result.databaseStatus}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Telefone: {result.databasePhone || 'Não informado'}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Status Real (Evolution API)</h4>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.realStatus)}
                  <Badge variant={getStatusVariant(result.realStatus)}>
                    {result.realStatus}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Telefone: {result.realPhone || 'Não conectado'}
                </p>
              </div>
            </div>

            {(result.statusMismatch || result.phoneMismatch || result.needsConnection) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Problemas detectados:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {result.statusMismatch && (
                      <li>Status no banco difere do status real</li>
                    )}
                    {result.phoneMismatch && (
                      <li>Número de telefone no banco difere do real</li>
                    )}
                    {result.needsConnection && (
                      <li>Instância precisa ser conectada a um dispositivo WhatsApp real</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Recomendações:</h4>
                <ul className="text-sm space-y-1">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(result.qrCode || qrCodeForConnection) && (
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code para Conexão
                </h4>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img 
                    src={qrCodeForConnection || result.qrCode} 
                    alt="QR Code WhatsApp" 
                    className="max-w-[200px] max-h-[200px]"
                  />
                </div>
                <Alert>
                  <AlertDescription>
                    <strong>Instruções:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Abra o WhatsApp no seu telefone</li>
                      <li>Vá em Configurações → Dispositivos conectados</li>
                      <li>Toque em "Conectar um dispositivo"</li>
                      <li>Escaneie este QR Code</li>
                      <li>Aguarde a confirmação de conexão</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppRealStatusChecker;