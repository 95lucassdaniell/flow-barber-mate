import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Monitor, AlertTriangle, CheckCircle, Phone, QrCode } from 'lucide-react';

interface MonitorResult {
  success: boolean;
  instance_name: string;
  connection_state: string;
  phone_number: string | null;
  has_qr_code: boolean;
  needs_new_connection: boolean;
  monitoring_results: {
    database_status: string;
    real_status: string;
    database_phone: string | null;
    real_phone: string | null;
    ghost_connection_detected: boolean;
  };
}

export const WhatsAppConnectionMonitor: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [result, setResult] = useState<MonitorResult | null>(null);
  const { toast } = useToast();

  const runMonitoring = async () => {
    setIsMonitoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-connection-monitor');
      
      if (error) throw error;
      
      setResult(data);
      
      if (data.success) {
        toast({
          title: "Monitoramento Concluído",
          description: `Status: ${data.connection_state}`,
        });
      }
    } catch (error) {
      console.error('Error running connection monitoring:', error);
      toast({
        title: "Erro no Monitoramento",
        description: "Falha ao verificar status da conexão",
        variant: "destructive",
      });
    } finally {
      setIsMonitoring(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'ghost_connection': return <AlertTriangle className="h-4 w-4" />;
      case 'awaiting_qr_scan': return <QrCode className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'ghost_connection': return 'destructive';
      case 'awaiting_qr_scan': return 'secondary';
      default: return 'destructive';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Monitor de Conexão WhatsApp
        </CardTitle>
        <CardDescription>
          Monitora e corrige automaticamente problemas de conexão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runMonitoring} 
          disabled={isMonitoring}
          className="w-full"
        >
          {isMonitoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isMonitoring ? 'Monitorando...' : 'Executar Monitoramento'}
        </Button>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Status da Conexão</h4>
                <Badge variant={getStatusVariant(result.connection_state)} className="flex items-center gap-1">
                  {getStatusIcon(result.connection_state)}
                  {result.connection_state}
                </Badge>
              </div>
              
              {result.phone_number && (
                <div className="space-y-2">
                  <h4 className="font-medium">Telefone Conectado</h4>
                  <Badge variant="default" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {result.phone_number}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Análise Detalhada</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Status no Banco:</span>
                  <Badge variant="outline">{result.monitoring_results.database_status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Status Real:</span>
                  <Badge variant="outline">{result.monitoring_results.real_status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Telefone no Banco:</span>
                  <span>{result.monitoring_results.database_phone || 'Nenhum'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Telefone Real:</span>
                  <span>{result.monitoring_results.real_phone || 'Nenhum'}</span>
                </div>
              </div>
            </div>

            {result.monitoring_results.ghost_connection_detected && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Conexão Fantasma Detectada</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  A instância está marcada como conectada mas não há dispositivo real associado.
                </p>
              </div>
            )}

            {result.has_qr_code && (
              <div className="p-3 bg-secondary/50 border border-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  <span className="font-medium">QR Code Disponível</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Um novo QR code foi gerado. Escaneie com seu WhatsApp para conectar.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};