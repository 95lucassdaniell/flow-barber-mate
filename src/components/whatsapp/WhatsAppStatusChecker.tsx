import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Phone, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppStatusData {
  status: string;
  connected: boolean;
  phone_number?: string;
  instance_id?: string;
  api_type?: string;
}

const WhatsAppStatusChecker = () => {
  const [statusData, setStatusData] = useState<WhatsAppStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-status');
      
      if (error) {
        toast.error("Erro ao verificar status do WhatsApp");
        return;
      }

      setStatusData(data);
      setLastChecked(new Date());
      
      if (data.connected) {
        toast.success("WhatsApp conectado com sucesso!");
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error("Erro ao verificar status");
    } finally {
      setLoading(false);
    }
  };

  const testMessage = async () => {
    if (!statusData?.connected) {
      toast.error("WhatsApp não está conectado");
      return;
    }

    try {
      const testPhone = statusData.phone_number?.replace(/[@\w.]+$/, '') || '5562999999999';
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phone: testPhone,
          message: "🤖 Teste de conectividade do sistema WhatsApp Business\n\nSe você recebeu esta mensagem, o sistema está funcionando corretamente!"
        }
      });

      if (error) {
        toast.error("Erro ao enviar mensagem de teste");
        return;
      }

      toast.success("Mensagem de teste enviada com sucesso!");
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error("Erro ao enviar mensagem de teste");
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (loading) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    if (!statusData) return <AlertCircle className="h-5 w-5 text-gray-500" />;
    return statusData.connected 
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (loading) return <Badge variant="outline">Verificando...</Badge>;
    if (!statusData) return <Badge variant="secondary">Desconhecido</Badge>;
    
    switch (statusData.status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800">Conectando</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Desconectado</Badge>;
      default:
        return <Badge variant="secondary">{statusData.status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Status do WhatsApp
            </CardTitle>
            <CardDescription>
              Monitore a conexão em tempo real
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Informações da Conexão</div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className="font-medium">{statusData.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>API:</span>
                  <span className="font-medium">{statusData.api_type || 'N/A'}</span>
                </div>
                {statusData.phone_number && (
                  <div className="flex items-center justify-between">
                    <span>Número:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {statusData.phone_number}
                    </span>
                  </div>
                )}
                {statusData.instance_id && (
                  <div className="flex items-center justify-between">
                    <span>Instância:</span>
                    <span className="font-medium text-xs">{statusData.instance_id}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Última Verificação</div>
              <div className="text-sm text-muted-foreground">
                {lastChecked ? lastChecked.toLocaleTimeString() : 'Nunca'}
              </div>
              
              {statusData.connected && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testMessage}
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Teste
                </Button>
              )}
            </div>
          </div>
        )}
        
        {!statusData && !loading && (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Clique em verificar para obter informações do status
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppStatusChecker;