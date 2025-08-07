import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Smartphone,
  Trash2
} from "lucide-react";

interface ResetResult {
  success: boolean;
  instance_name?: string;
  steps_completed: string[];
  errors: string[];
  qr_code?: string | null;
  next_steps?: string[];
}

const WhatsAppCompleteReset = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const { toast } = useToast();

  const executeReset = async () => {
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-complete-reset');
      
      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Reset completo executado",
          description: `Nova instância criada: ${data.instance_name}`,
        });
      } else {
        toast({
          title: "Reset parcialmente concluído",
          description: `${data.steps_completed.length} etapas concluídas com ${data.errors.length} erros`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error executing reset:', error);
      toast({
        title: "Erro no reset",
        description: "Falha ao executar reset completo",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
      setConfirmReset(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Reset Completo
        </CardTitle>
        <CardDescription>
          Regenera completamente a instância WhatsApp (remove todas as mensagens)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!confirmReset ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>ATENÇÃO:</strong> Esta ação irá:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Deletar a instância atual da Evolution API</li>
                  <li>Remover TODAS as mensagens e conversas do banco</li>
                  <li>Criar uma nova instância com novo QR Code</li>
                  <li>Reconfigurar todos os webhooks</li>
                </ul>
                Esta ação é irreversível!
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => setConfirmReset(true)}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eu entendo - Executar reset completo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tem certeza? Esta é sua última chance de cancelar antes de executar o reset completo.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={executeReset}
                disabled={isResetting}
                variant="destructive"
                className="flex-1"
              >
                {isResetting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                {isResetting ? 'Executando reset...' : 'SIM - Executar agora'}
              </Button>
              
              <Button 
                onClick={() => setConfirmReset(false)}
                variant="outline"
                disabled={isResetting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Resultado do Reset</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium">
                    {result.success ? 'Reset concluído com sucesso' : 'Reset parcialmente concluído'}
                  </span>
                </div>
                
                {result.instance_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Nova instância: <code className="text-xs">{result.instance_name}</code>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Steps Completed */}
            {result.steps_completed.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Etapas Concluídas ({result.steps_completed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {result.steps_completed.map((step, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Erros Encontrados ({result.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* QR Code */}
            {result.qr_code && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Novo QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <img 
                    src={result.qr_code} 
                    alt="QR Code WhatsApp" 
                    className="mx-auto max-w-[250px] border rounded"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Escaneie com o WhatsApp para conectar a nova instância
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            {result.next_steps && result.next_steps.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Próximas Etapas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-1">
                    {result.next_steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppCompleteReset;