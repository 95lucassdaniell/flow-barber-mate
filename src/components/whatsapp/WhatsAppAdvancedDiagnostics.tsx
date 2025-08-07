import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Scan, 
  Wifi, 
  MessageCircle, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Activity,
  Smartphone,
  Webhook
} from "lucide-react";

interface AdvancedDiagnostics {
  database_status: string;
  database_phone: string | null;
  evolution_status: string | null;
  evolution_phone: string | null;
  webhook_configured: boolean;
  webhook_events: string[];
  message_count_24h: number;
  last_message_time: string | null;
  connection_issues: string[];
  recommendations: string[];
}

interface DiagnosticsResult {
  success: boolean;
  diagnostics: AdvancedDiagnostics;
  health_score: number;
  health_status: 'healthy' | 'warning' | 'critical';
}

const WhatsAppAdvancedDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticsResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-advanced-diagnostics');
      
      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Diagnóstico avançado concluído",
          description: `Score de saúde: ${data.health_score}%`,
        });
      } else {
        toast({
          title: "Erro no diagnóstico",
          description: data.error || "Falha na verificação avançada",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error running advanced diagnostics:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar diagnóstico avançado",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(runDiagnostics, 30000); // Auto refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  const formatLastMessageTime = (timestamp: string | null) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} h atrás`;
    return `${Math.floor(diffMinutes / 1440)} dias atrás`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Diagnóstico Avançado
        </CardTitle>
        <CardDescription>
          Análise detalhada da saúde da conexão WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Scan className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Analisando...' : 'Executar diagnóstico'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            {/* Health Score */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Score de Saúde
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getHealthColor(result.health_score)}`}>
                      {result.health_score}%
                    </span>
                    <Badge variant={getHealthBadgeVariant(result.health_status)}>
                      {result.health_status === 'healthy' && 'Saudável'}
                      {result.health_status === 'warning' && 'Atenção'}
                      {result.health_status === 'critical' && 'Crítico'}
                    </Badge>
                  </div>
                  <Progress 
                    value={result.health_score} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Status de Conexão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Banco de dados:</span>
                    <Badge variant="outline">
                      {result.diagnostics.database_status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Evolution API:</span>
                    <Badge variant={result.diagnostics.evolution_status === 'open' ? 'default' : 'destructive'}>
                      {result.diagnostics.evolution_status || 'desconhecido'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      Telefone:
                    </span>
                    <span className="text-sm font-mono">
                      {result.diagnostics.database_phone || result.diagnostics.evolution_phone || 'Não conectado'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Atividade de Mensagens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Últimas 24h:</span>
                    <Badge variant={result.diagnostics.message_count_24h > 0 ? 'default' : 'secondary'}>
                      {result.diagnostics.message_count_24h} mensagens
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Última mensagem:
                    </span>
                    <span className="text-sm">
                      {formatLastMessageTime(result.diagnostics.last_message_time)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Webhook Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Configuração Webhook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge variant={result.diagnostics.webhook_configured ? 'default' : 'destructive'}>
                    {result.diagnostics.webhook_configured ? 'Configurado' : 'Não configurado'}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <span className="text-sm">Eventos configurados:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.diagnostics.webhook_events.map((event, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Issues */}
            {result.diagnostics.connection_issues.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Problemas Detectados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.diagnostics.connection_issues.map((issue, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{issue}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.diagnostics.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.diagnostics.recommendations.map((rec, index) => (
                      <Alert key={index}>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppAdvancedDiagnostics;