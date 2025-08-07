import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Wifi, MessageCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  icon: React.ComponentType<any>;
}

const WhatsAppConnectionWizard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState<NodeJS.Timeout | null>(null);

  const [steps, setSteps] = useState<WizardStep[]>([
    {
      id: 'init',
      title: 'Inicializar Conexão',
      description: 'Preparando instância WhatsApp',
      status: 'pending',
      icon: Wifi
    },
    {
      id: 'qr',
      title: 'Gerar QR Code',
      description: 'Código QR para conectar WhatsApp',
      status: 'pending',
      icon: QrCode
    },
    {
      id: 'connect',
      title: 'Conectar WhatsApp',
      description: 'Escaneie o QR code no seu telefone',
      status: 'pending',
      icon: MessageCircle
    },
    {
      id: 'test',
      title: 'Testar Conexão',
      description: 'Enviando mensagem de teste',
      status: 'pending',
      icon: CheckCircle
    }
  ]);

  const updateStepStatus = (stepId: string, status: WizardStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const startWizard = async () => {
    if (!profile?.barbershop_id) {
      toast({
        title: "Erro",
        description: "Barbearia não encontrada",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setCurrentStep(0);
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })));

    try {
      // Step 1: Initialize connection
      updateStepStatus('init', 'active');
      
      // First, reset the instance completely
      console.log('Resetting WhatsApp instance...');
      const { data: resetData, error: resetError } = await supabase.functions.invoke('whatsapp-reset-instance', {
        body: { barbershopId: profile.barbershop_id }
      });

      if (resetError) {
        throw new Error(`Reset failed: ${resetError.message}`);
      }

      updateStepStatus('init', 'completed');
      setCurrentStep(1);

      // Step 2: Generate QR Code
      updateStepStatus('qr', 'active');
      await generateQRCode();

      updateStepStatus('qr', 'completed');
      setCurrentStep(2);

      // Step 3: Monitor connection
      updateStepStatus('connect', 'active');
      startConnectionMonitoring();

    } catch (error) {
      console.error('Erro no wizard:', error);
      updateStepStatus('init', 'failed');
      toast({
        title: "Erro na inicialização",
        description: error.message,
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const generateQRCode = async () => {
    if (!profile?.barbershop_id) return;

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-connect', {
        body: { barbershopId: profile.barbershop_id }
      });

      if (error) throw error;

      if (data.qr_code) {
        setQrCode(data.qr_code);
        console.log('QR Code gerado com sucesso');
      } else if (data.status === 'connected') {
        // Already connected
        updateStepStatus('connect', 'completed');
        setCurrentStep(3);
        await sendTestMessage();
      }
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      updateStepStatus('qr', 'failed');
      throw error;
    }
  };

  const startConnectionMonitoring = () => {
    // Clear any existing timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }

    const checkConnection = async () => {
      if (!profile?.barbershop_id) return;

      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-status', {
          body: { barbershopId: profile.barbershop_id }
        });

        if (error) throw error;

        if (data.connected && data.phone_number) {
          // Connection successful!
          updateStepStatus('connect', 'completed');
          setCurrentStep(3);
          setQrCode(null);
          
          // Clear timeout and proceed to test
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            setConnectionTimeout(null);
          }
          
          await sendTestMessage();
        } else {
          // Still connecting, check again in 3 seconds
          const timeout = setTimeout(checkConnection, 3000);
          setConnectionTimeout(timeout);
        }
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        // Continue checking
        const timeout = setTimeout(checkConnection, 5000);
        setConnectionTimeout(timeout);
      }
    };

    // Start checking after 2 seconds
    const timeout = setTimeout(checkConnection, 2000);
    setConnectionTimeout(timeout);

    // Set overall timeout of 2 minutes
    setTimeout(() => {
      if (steps.find(s => s.id === 'connect')?.status === 'active') {
        updateStepStatus('connect', 'failed');
        setIsConnecting(false);
        toast({
          title: "Timeout",
          description: "Timeout na conexão. Tente novamente.",
          variant: "destructive",
        });
      }
    }, 120000);
  };

  const sendTestMessage = async () => {
    if (!profile?.barbershop_id) return;

    updateStepStatus('test', 'active');

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          barbershopId: profile.barbershop_id,
          phone: "test",
          message: "🎉 WhatsApp conectado com sucesso! Sistema funcionando perfeitamente.",
          messageType: "text"
        }
      });

      if (error) throw error;

      updateStepStatus('test', 'completed');
      setCurrentStep(4);
      setIsConnecting(false);
      
      toast({
        title: "Sucesso!",
        description: "WhatsApp conectado e testado com sucesso!",
      });
      
    } catch (error) {
      console.error('Erro no teste:', error);
      updateStepStatus('test', 'failed');
      toast({
        title: "Aviso",
        description: "Conexão estabelecida, mas falha no teste de envio",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, [connectionTimeout]);

  const getStepIcon = (step: WizardStep) => {
    const Icon = step.icon;
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Icon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Assistente de Conexão WhatsApp
        </CardTitle>
        <CardDescription>
          Configure sua conexão WhatsApp passo a passo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              {getStepIcon(step)}
              <div className="flex-1">
                <div className="font-medium">{step.title}</div>
                <div className="text-sm text-muted-foreground">{step.description}</div>
              </div>
              {index === currentStep && step.status === 'active' && (
                <div className="text-sm text-blue-600 font-medium">Em andamento...</div>
              )}
            </div>
          ))}
        </div>

        {/* QR Code Display */}
        {qrCode && (
          <Card className="p-4">
            <div className="text-center space-y-4">
              <h3 className="font-medium">Escaneie o QR Code no WhatsApp</h3>
              <div className="flex justify-center">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="max-w-[300px] max-h-[300px] border rounded"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                1. Abra o WhatsApp no seu telefone<br/>
                2. Toque em Mais opções → Dispositivos conectados<br/>
                3. Toque em Conectar dispositivo<br/>
                4. Aponte seu telefone para esta tela
              </p>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={startWizard} 
            disabled={isConnecting}
            className="flex-1"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Conectando...
              </>
            ) : (
              'Iniciar Conexão'
            )}
          </Button>
          
          {currentStep >= 2 && !isConnecting && (
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Reconfigurar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConnectionWizard;