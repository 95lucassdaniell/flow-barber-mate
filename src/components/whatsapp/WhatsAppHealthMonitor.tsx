import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HealthResult {
  instance_name: string;
  barbershop: string;
  previous_status: string;
  actual_status: string;
  needs_reconnection: boolean;
  recent_messages: number;
  error?: string;
}

interface HealthData {
  success: boolean;
  timestamp: string;
  checked_instances: number;
  results: HealthResult[];
}

const WhatsAppHealthMonitor = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-health-monitor');
      
      if (error) {
        toast.error("Erro ao executar verificação de saúde");
        console.error('Health check error:', error);
        return;
      }

      setHealthData(data);
      setLastCheck(new Date());
      
      const reconnectionCount = data.results?.filter(r => r.needs_reconnection).length || 0;
      
      if (reconnectionCount > 0) {
        toast.warning(`${reconnectionCount} instância(s) precisam de reconexão`);
      } else {
        toast.success("Todas as instâncias estão funcionando corretamente");
      }
    } catch (error) {
      console.error('Error running health check:', error);
      toast.error("Erro ao verificar saúde do sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
    
    // Auto-run every 5 minutes
    const interval = setInterval(runHealthCheck, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'open':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'disconnected':
      case 'close':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (result: HealthResult) => {
    if (result.error) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (result.needs_reconnection) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monitor de Saúde WhatsApp
            </CardTitle>
            <CardDescription>
              Verificação automática de instâncias e reconexão
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runHealthCheck}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Verificando...' : 'Verificar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastCheck && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Última verificação: {lastCheck.toLocaleString()}
          </div>
        )}

        {healthData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{healthData.checked_instances}</div>
                <div className="text-sm text-muted-foreground">Instâncias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {healthData.results?.filter(r => !r.needs_reconnection && !r.error).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Saudáveis</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {healthData.results?.filter(r => r.needs_reconnection || r.error).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Problemas</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Status das Instâncias</div>
              {healthData.results?.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result)}
                    <div>
                      <div className="font-medium">{result.barbershop}</div>
                      <div className="text-sm text-muted-foreground">{result.instance_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(result.actual_status)}`}>
                      {result.actual_status}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {result.recent_messages} mensagem(s) recentes
                    </div>
                    {result.error && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Erro
                      </Badge>
                    )}
                    {result.needs_reconnection && !result.error && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Reconectando
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!healthData && !loading && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Execute uma verificação para ver o status das instâncias
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppHealthMonitor;