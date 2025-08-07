import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, AlertCircle, XCircle, Smartphone, Webhook, Zap } from "lucide-react";

interface DiagnosticResult {
  success: boolean;
  analysis: {
    database_status: string;
    real_status: string;
    phone_number: string | null;
    is_really_connected: boolean;
    webhook_configured: boolean;
    needs_qr_code: boolean;
  };
  fixes_applied: string[];
  final_status: string;
  qr_code: string | null;
  recommendations: string[];
}

const WhatsAppDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-verify-and-fix');
      
      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Diagnóstico concluído",
          description: `${data.fixes_applied.length} correções aplicadas.`,
        });
      } else {
        toast({
          title: "Erro no diagnóstico",
          description: data.error || "Falha na verificação",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar diagnóstico",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'awaiting_qr_scan':
        return <Smartphone className="h-4 w-4 text-yellow-500" />;
      case 'disconnected':
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'connected':
        return 'default';
      case 'awaiting_qr_scan':
        return 'secondary';
      case 'disconnected':
      default:
        return 'destructive';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Diagnóstico WhatsApp
        </CardTitle>
        <CardDescription>
          Verifica o status real da conexão e aplica correções automáticas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          {isRunning ? 'Executando diagnóstico...' : 'Executar diagnóstico'}
        </Button>

        {result && (
          <div className="space-y-4">
            {/* Status Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Análise do Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status no banco:</span>
                  <Badge variant={getStatusColor(result.analysis.database_status)}>
                    {getStatusIcon(result.analysis.database_status)}
                    <span className="ml-1">{result.analysis.database_status}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status real (Evolution API):</span>
                  <Badge variant={getStatusColor(result.analysis.real_status)}>
                    {getStatusIcon(result.analysis.real_status)}
                    <span className="ml-1">{result.analysis.real_status}</span>
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Número conectado:</span>
                  <span className="text-sm font-mono">
                    {result.analysis.phone_number || 'Nenhum'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    Realmente conectado:
                  </span>
                  <Badge variant={result.analysis.is_really_connected ? 'default' : 'destructive'}>
                    {result.analysis.is_really_connected ? 'Sim' : 'Não'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-1">
                    <Webhook className="h-3 w-3" />
                    Webhook configurado:
                  </span>
                  <Badge variant={result.analysis.webhook_configured ? 'default' : 'destructive'}>
                    {result.analysis.webhook_configured ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Fixes Applied */}
            {result.fixes_applied.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Correções Aplicadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {result.fixes_applied.map((fix, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {fix}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* QR Code */}
            {result.qr_code && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">QR Code para Conexão</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <img 
                    src={result.qr_code} 
                    alt="QR Code WhatsApp" 
                    className="mx-auto max-w-[200px] border rounded"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Escaneie com o WhatsApp para conectar
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <Alert key={index}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Final Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status Final</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={getStatusColor(result.final_status)} className="text-sm">
                  {getStatusIcon(result.final_status)}
                  <span className="ml-1">{result.final_status}</span>
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppDiagnostics;