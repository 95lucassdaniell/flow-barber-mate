import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  Zap,
  Activity,
  MessageSquare,
  Wifi,
  WifiOff
} from 'lucide-react';

interface HealthReport {
  instance_id: string;
  instance_name: string;
  database_status: string;
  evolution_api_status: string;
  webhook_configured: boolean;
  recent_messages: number;
  issues: string[];
  recommendations: string[];
}

interface HealthCheckResult {
  success: boolean;
  timestamp: string;
  total_instances: number;
  healthy_instances: number;
  instances_with_issues: number;
  health_report: HealthReport[];
}

export function WhatsAppHealthMonitor() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const runHealthCheck = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-health-monitor', {
        body: {
          action: 'health_check'
        }
      });

      if (error) throw error;

      setHealthData(data);
      
      if (data.instances_with_issues > 0) {
        toast.warning(`Encontrados ${data.instances_with_issues} problemas no WhatsApp`);
      } else {
        toast.success('Todas as instâncias WhatsApp estão funcionando corretamente');
      }
    } catch (error) {
      console.error('Error running health check:', error);
      toast.error('Erro ao verificar saúde do WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const fixWebhook = async (barbershopId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-health-monitor', {
        body: {
          action: 'fix_webhook',
          barbershop_id: barbershopId
        }
      });

      if (error) throw error;

      toast.success('Webhook reconfigurado com sucesso');
      await runHealthCheck(); // Refresh health data
    } catch (error) {
      console.error('Error fixing webhook:', error);
      toast.error('Erro ao reconfigurar webhook');
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (barbershopId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-health-monitor', {
        body: {
          action: 'test_webhook',
          barbershop_id: barbershopId
        }
      });

      if (error) throw error;

      if (data.webhook_reachable) {
        toast.success('Webhook está funcionando corretamente');
      } else {
        toast.error('Webhook não está respondendo');
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Erro ao testar webhook');
    } finally {
      setLoading(false);
    }
  };

  const performFullRecovery = async (barbershopId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-health-monitor', {
        body: {
          action: 'full_recovery',
          barbershop_id: barbershopId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Recuperação completa executada com sucesso');
      } else {
        toast.warning('Recuperação concluída com alguns problemas');
      }
      
      await runHealthCheck(); // Refresh health data
    } catch (error) {
      console.error('Error performing full recovery:', error);
      toast.error('Erro na recuperação completa');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'close':
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'connecting':
        return <Badge variant="secondary">Conectando</Badge>;
      case 'close':
      case 'disconnected':
        return <Badge variant="destructive">Desconectado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, [user]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(runHealthCheck, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monitor de Saúde WhatsApp
              </CardTitle>
              <CardDescription>
                Monitore e corrija problemas na integração WhatsApp
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 text-green-700' : ''}
              >
                {autoRefresh ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                Auto-refresh
              </Button>
              <Button
                onClick={runHealthCheck}
                disabled={loading}
                size="sm"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Verificar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {healthData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{healthData.total_instances}</div>
                  <div className="text-sm text-gray-600">Total de Instâncias</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{healthData.healthy_instances}</div>
                  <div className="text-sm text-gray-600">Funcionando</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{healthData.instances_with_issues}</div>
                  <div className="text-sm text-gray-600">Com Problemas</div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Última verificação: {new Date(healthData.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {healthData?.health_report.map((report) => (
        <Card key={report.instance_id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(report.evolution_api_status)}
                <CardTitle className="text-lg">{report.instance_name}</CardTitle>
                {getStatusBadge(report.evolution_api_status)}
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">{report.recent_messages} mensagens/hora</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Status BD:</span>
                <div>{report.database_status}</div>
              </div>
              <div>
                <span className="font-medium">Status API:</span>
                <div>{report.evolution_api_status}</div>
              </div>
              <div>
                <span className="font-medium">Webhook:</span>
                <div className={report.webhook_configured ? 'text-green-600' : 'text-red-600'}>
                  {report.webhook_configured ? 'Configurado' : 'Não configurado'}
                </div>
              </div>
              <div>
                <span className="font-medium">Mensagens recentes:</span>
                <div>{report.recent_messages}</div>
              </div>
            </div>

            {report.issues.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Problemas encontrados:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {report.issues.map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {report.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-sm">Recomendações:</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {report.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.issues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    // Get barbershop_id for this instance
                    const barbershopId = healthData?.health_report.find(r => r.instance_id === report.instance_id)?.instance_id;
                    if (barbershopId) fixWebhook(barbershopId);
                  }}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Corrigir Webhook
                </Button>
                <Button
                  onClick={() => {
                    const barbershopId = healthData?.health_report.find(r => r.instance_id === report.instance_id)?.instance_id;
                    if (barbershopId) testWebhook(barbershopId);
                  }}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Testar Conectividade
                </Button>
                <Button
                  onClick={() => {
                    const barbershopId = healthData?.health_report.find(r => r.instance_id === report.instance_id)?.instance_id;
                    if (barbershopId) performFullRecovery(barbershopId);
                  }}
                  disabled={loading}
                  size="sm"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Recuperação Completa
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}