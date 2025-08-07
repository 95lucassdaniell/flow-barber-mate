import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  TestTube, 
  MessageCircle, 
  Webhook, 
  Search,
  Play,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface TestResult {
  success: boolean;
  message: string;
  webhook_status?: number;
  webhook_response?: string;
  recent_messages?: any[];
  count?: number;
  test_payload?: any;
  webhook_reachable?: boolean;
  response_time?: number;
}

const WhatsAppMessageTester = () => {
  const [testPhone, setTestPhone] = useState('5511999999999');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<{
    simulate?: TestResult;
    connectivity?: TestResult;
    recent?: TestResult;
  }>({});
  const { toast } = useToast();

  const simulateIncomingMessage = async () => {
    setIsSimulating(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-message-test', {
        body: {
          action: 'simulate_incoming',
          test_phone: `${testPhone}@s.whatsapp.net`
        }
      });
      
      if (error) throw error;

      setResults(prev => ({ ...prev, simulate: data }));
      
      toast({
        title: data.success ? "Simulação enviada" : "Erro na simulação",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error simulating message:', error);
      toast({
        title: "Erro",
        description: "Falha ao simular mensagem",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const testWebhookConnectivity = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-message-test', {
        body: { action: 'test_webhook_connectivity' }
      });
      
      if (error) throw error;

      setResults(prev => ({ ...prev, connectivity: data }));
      
      toast({
        title: data.success ? "Webhook acessível" : "Problema no webhook",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Erro",
        description: "Falha ao testar webhook",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const checkRecentMessages = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-message-test', {
        body: { action: 'check_recent_messages' }
      });
      
      if (error) throw error;

      setResults(prev => ({ ...prev, recent: data }));
      
      toast({
        title: "Verificação concluída",
        description: `${data.count || 0} mensagens encontradas nos últimos 10 minutos`,
      });
    } catch (error) {
      console.error('Error checking messages:', error);
      toast({
        title: "Erro",
        description: "Falha ao verificar mensagens",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Teste de Mensagens
        </CardTitle>
        <CardDescription>
          Simule e teste o recebimento de mensagens WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-phone">Número para teste (sem +55 e sem formatação)</Label>
            <Input
              id="test-phone"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="11999999999"
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button 
              onClick={simulateIncomingMessage}
              disabled={isSimulating}
              variant="outline"
            >
              {isSimulating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Simular mensagem
            </Button>

            <Button 
              onClick={testWebhookConnectivity}
              disabled={isTesting}
              variant="outline"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Webhook className="h-4 w-4 mr-2" />
              )}
              Testar webhook
            </Button>

            <Button 
              onClick={checkRecentMessages}
              disabled={isChecking}
              variant="outline"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Ver mensagens
            </Button>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {/* Simulate Result */}
          {results.simulate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Simulação de Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {results.simulate.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">{results.simulate.message}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Status webhook:</span>
                  <Badge variant={results.simulate.webhook_status === 200 ? 'default' : 'destructive'}>
                    {results.simulate.webhook_status}
                  </Badge>
                </div>

                {results.simulate.test_payload && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground">Ver payload enviado</summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(results.simulate.test_payload, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {/* Connectivity Result */}
          {results.connectivity && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Teste de Conectividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {results.connectivity.webhook_reachable ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">{results.connectivity.message}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={results.connectivity.webhook_status === 200 ? 'default' : 'destructive'}>
                      {results.connectivity.webhook_status}
                    </Badge>
                  </div>
                  
                  {results.connectivity.response_time && (
                    <div className="flex justify-between">
                      <span>Tempo:</span>
                      <span className="font-mono">{results.connectivity.response_time}ms</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Messages Result */}
          {results.recent && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Mensagens Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Últimos 10 minutos:</span>
                  <Badge variant={results.recent.count && results.recent.count > 0 ? 'default' : 'secondary'}>
                    {results.recent.count || 0} mensagens
                  </Badge>
                </div>

                {results.recent.recent_messages && results.recent.recent_messages.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Mensagens encontradas:</span>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {results.recent.recent_messages.slice(0, 5).map((msg: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-muted rounded">
                          <div className="flex justify-between items-start">
                            <span className="font-mono">{msg.phone_number}</span>
                            <span className="text-muted-foreground">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="mt-1 truncate">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma mensagem recebida nos últimos 10 minutos
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Instructions */}
        <Alert>
          <Play className="h-4 w-4" />
          <AlertDescription>
            <strong>Como usar:</strong> Use "Simular mensagem" para testar se o webhook está funcionando. 
            Se a simulação for bem-sucedida mas nenhuma mensagem aparecer no banco, 
            verifique os logs da Evolution API e a configuração dos eventos do webhook.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default WhatsAppMessageTester;