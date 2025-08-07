import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Zap, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface GhostFixResult {
  success: boolean;
  instanceName: string;
  originalStatus: string;
  finalStatus: string;
  phoneNumber?: string;
  qrCode?: string;
  fixes: string[];
  recommendations: string[];
  ghostConnectionFixed: boolean;
}

const WhatsAppGhostConnectionFixer = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<GhostFixResult | null>(null);
  const { toast } = useToast();

  const fixGhostConnection = async () => {
    setIsFixing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ghost-connection-fix');
      
      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Correção Executada",
          description: `${data.fixes.length} correções aplicadas na instância ${data.instanceName}`,
        });
      } else {
        toast({
          title: "Erro na Correção",
          description: data.error || "Falha ao corrigir conexão fantasma",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao corrigir conexão fantasma:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar correção da conexão fantasma",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'awaiting_qr_scan': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'disconnected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'awaiting_qr_scan': return 'secondary';
      case 'disconnected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Correção de Conexão Fantasma
        </CardTitle>
        <CardDescription>
          Detecta e corrige conexões fantasma (instância conectada sem dispositivo real)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={fixGhostConnection} 
          disabled={isFixing}
          className="w-full"
        >
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Corrigindo Conexão...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Corrigir Conexão Fantasma
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Resultado da Correção</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status Original</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.originalStatus)}
                    <Badge variant={getStatusVariant(result.originalStatus)}>
                      {result.originalStatus}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Status Final</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.finalStatus)}
                    <Badge variant={getStatusVariant(result.finalStatus)}>
                      {result.finalStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {result.phoneNumber && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Telefone Conectado</p>
                  <p className="font-mono text-sm">{result.phoneNumber}</p>
                </div>
              )}

              {result.ghostConnectionFixed && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <p className="text-green-800 font-semibold">✅ Conexão fantasma corrigida!</p>
                  <p className="text-green-700 text-sm">O sistema detectou e corrigiu uma conexão sem dispositivo real.</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Correções Aplicadas:</h4>
                {result.fixes.map((fix, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-50 rounded border-l-4 border-blue-400">
                    {fix}
                  </div>
                ))}
              </div>

              <div className="space-y-2 mt-4">
                <h4 className="font-semibold text-sm">Recomendações:</h4>
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                    {rec}
                  </div>
                ))}
              </div>

              {result.qrCode && !result.phoneNumber && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-2">QR Code para Conexão:</h4>
                  <div className="flex justify-center p-4 bg-white border rounded-lg">
                    <img 
                      src={result.qrCode} 
                      alt="QR Code WhatsApp" 
                      className="max-w-xs"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Escaneie este QR Code com seu WhatsApp para conectar um dispositivo real
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppGhostConnectionFixer;