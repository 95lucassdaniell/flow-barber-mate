import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Bug,
  Wifi,
  Database,
  MessageSquare,
  Webhook
} from "lucide-react";

export const EvolutionDebugPanel = () => {
  const { user, profile } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const runDiagnostic = async (testType = 'all') => {
    if (!profile?.barbershop_id) {
      toast.error("Barbearia não identificada");
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-evolution-api', {
        body: {
          barbershopId: profile.barbershop_id,
          testType
        }
      });

      if (error) {
        throw error;
      }

      setTestResults(data);
      
      const failedTests = Object.values(data.tests).filter((test: any) => !test.success);
      if (failedTests.length === 0) {
        toast.success("Todos os testes passaram!");
      } else {
        toast.error(`${failedTests.length} teste(s) falharam`);
      }
    } catch (error) {
      console.error('Diagnostic error:', error);
      toast.error("Erro ao executar diagnóstico");
    } finally {
      setTesting(false);
    }
  };

  const TestResult = ({ test, label }: { test: any, label: string }) => {
    if (!test) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{label}</CardTitle>
            <Badge variant={test.success ? "default" : "destructive"}>
              {test.success ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              {test.success ? 'Sucesso' : 'Falha'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">{test.message}</p>

          {/* Show troubleshooting info for errors */}
          {!test.success && test.troubleshooting && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded">
              <div className="text-sm font-medium text-amber-800 mb-1">
                💡 Solução Sugerida:
              </div>
              <div className="text-sm text-amber-700">
                {test.troubleshooting}
              </div>
              {test.api_url && (
                <div className="text-xs text-amber-600 mt-1">
                  URL testada: {test.api_url}
                </div>
              )}
            </div>
          )}

          {/* Show configuration help */}
          {test.configuration_help && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm font-medium text-blue-800 mb-1">
                ⚙️ Configuração:
              </div>
              <div className="text-sm text-blue-700">
                {test.configuration_help}
              </div>
            </div>
          )}
          
          {test.error && (
            <div className="bg-destructive/10 p-2 rounded text-sm text-destructive mb-2">
              <strong>Erro:</strong> {test.error}
            </div>
          )}

          {/* Show response preview for API errors */}
          {test.response_preview && (
            <div className="mb-2">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Resposta recebida (prévia):
              </div>
              <div className="text-xs font-mono bg-muted p-2 rounded border">
                {test.response_preview}...
              </div>
            </div>
          )}

          {/* Show instances if found */}
          {test.instances && test.instances.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-medium mb-2 text-green-700">
                ✅ Instâncias encontradas ({test.instanceCount}):
              </div>
              <div className="space-y-1">
                {test.instances.slice(0, 3).map((instance: any, idx: number) => (
                  <div key={idx} className="bg-green-50 p-2 rounded text-sm">
                    <div><strong>Nome:</strong> {instance.instanceName || 'N/A'}</div>
                    <div><strong>Status:</strong> {instance.status || 'N/A'}</div>
                  </div>
                ))}
                {test.instances.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    ... e mais {test.instances.length - 3} instâncias
                  </div>
                )}
              </div>
            </div>
          )}
          
          {test.instance && (
            <details className="mt-2">
              <summary className="text-sm font-medium cursor-pointer">Ver detalhes da instância</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify(test.instance, null, 2)}
              </pre>
            </details>
          )}
          
          {test.recentMessages && (
            <div className="mt-2">
              <p className="text-sm font-medium">Mensagens recentes: {test.messageCount}</p>
              {test.recentMessages.length > 0 ? (
                <ScrollArea className="h-20 mt-1">
                  {test.recentMessages.map((msg: any, idx: number) => (
                    <div key={idx} className="text-xs p-1 border-b">
                      <strong>{msg.direction}:</strong> {msg.content?.substring(0, 50)}...
                      <div className="text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              ) : (
                <div className="text-sm text-muted-foreground mt-1">
                  Nenhuma mensagem encontrada
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          <CardTitle>Diagnóstico Evolution API</CardTitle>
        </div>
        <CardDescription>
          Ferramentas para diagnosticar problemas com o WhatsApp e Evolution API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tests">Testes de Diagnóstico</TabsTrigger>
            <TabsTrigger value="manual">Testes Manuais</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tests" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => runDiagnostic('all')} 
                disabled={testing}
                className="flex items-center gap-2"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                Executar Todos os Testes
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => runDiagnostic('api_connectivity')} 
                disabled={testing}
              >
                <Wifi className="w-4 h-4 mr-2" />
                Conectividade API
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => runDiagnostic('webhook_test')} 
                disabled={testing}
              >
                <Webhook className="w-4 h-4 mr-2" />
                Teste Webhook
              </Button>
            </div>

            {testResults && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  Resultados do diagnóstico executado em {new Date(testResults.timestamp).toLocaleString()}
                </div>

                <TestResult test={testResults.tests.api_connectivity} label="Conectividade Evolution API" />
                <TestResult test={testResults.tests.database_instance} label="Instância no Banco de Dados" />
                <TestResult test={testResults.tests.evolution_instance} label="Instância na Evolution API" />
                <TestResult test={testResults.tests.webhook_test} label="Teste do Webhook" />
                <TestResult test={testResults.tests.webhook_logs} label="Mensagens Recentes" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Teste Manual de Mensagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Para testar se as mensagens estão sendo recebidas:
                  </p>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Envie uma mensagem para o número conectado no WhatsApp</li>
                    <li>Verifique se a mensagem aparece na aba de conversas</li>
                    <li>Se não aparecer, execute o diagnóstico completo</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Verificar Logs de Webhook
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use a função debug-evolution-webhook para capturar chamadas do webhook em tempo real.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast.info("Use o console do navegador para monitorar logs em tempo real");
                    }}
                  >
                    Abrir Console
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};