import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Circle, Loader2, QrCode, Smartphone, MessageSquare, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  icon: React.ReactNode;
}

const WhatsAppConnectionWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [steps, setSteps] = useState<WizardStep[]>([
    {
      id: 'instance',
      title: 'Verificar Instância',
      description: 'Validar configuração da instância WhatsApp',
      status: 'pending',
      icon: <Settings className="h-5 w-5" />
    },
    {
      id: 'qr_code',
      title: 'Gerar QR Code',
      description: 'Criar código QR para conexão',
      status: 'pending',
      icon: <QrCode className="h-5 w-5" />
    },
    {
      id: 'connection',
      title: 'Conectar WhatsApp',
      description: 'Escaneie o QR Code com seu celular',
      status: 'pending',
      icon: <Smartphone className="h-5 w-5" />
    },
    {
      id: 'test',
      title: 'Testar Mensagem',
      description: 'Enviar mensagem de teste',
      status: 'pending',
      icon: <MessageSquare className="h-5 w-5" />
    }
  ]);

  const updateStepStatus = (stepId: string, status: WizardStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const startWizard = async () => {
    // Step 1: Verificar instância
    setCurrentStep(0);
    updateStepStatus('instance', 'loading');
    
    try {
      const { data: statusData, error } = await supabase.functions.invoke('whatsapp-status');
      
      if (error) {
        updateStepStatus('instance', 'error');
        toast.error("Erro ao verificar instância");
        return;
      }

      updateStepStatus('instance', 'completed');
      
      // Step 2: Gerar QR Code
      setTimeout(() => {
        setCurrentStep(1);
        updateStepStatus('qr_code', 'loading');
        generateQRCode();
      }, 1000);
      
    } catch (error) {
      updateStepStatus('instance', 'error');
      toast.error("Erro na verificação da instância");
    }
  };

  const generateQRCode = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-connect');
      
      if (error) {
        updateStepStatus('qr_code', 'error');
        toast.error("Erro ao gerar QR Code");
        return;
      }

      setQrCode(data.qr_code);
      updateStepStatus('qr_code', 'completed');
      
      // Step 3: Aguardar conexão
      setTimeout(() => {
        setCurrentStep(2);
        updateStepStatus('connection', 'loading');
        startConnectionMonitoring();
      }, 1000);
      
    } catch (error) {
      updateStepStatus('qr_code', 'error');
      toast.error("Erro ao gerar QR Code");
    }
  };

  const startConnectionMonitoring = () => {
    const checkConnection = async () => {
      try {
        const { data } = await supabase.functions.invoke('whatsapp-status');
        
        if (data?.connected) {
          updateStepStatus('connection', 'completed');
          setQrCode(null);
          
          // Step 4: Teste de mensagem
          setTimeout(() => {
            setCurrentStep(3);
            updateStepStatus('test', 'loading');
            sendTestMessage();
          }, 1000);
          
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    };

    const interval = setInterval(async () => {
      const connected = await checkConnection();
      if (connected) {
        clearInterval(interval);
      }
    }, 3000);

    // Timeout após 5 minutos
    setTimeout(() => {
      clearInterval(interval);
      if (steps[2].status === 'loading') {
        updateStepStatus('connection', 'error');
        toast.error("Timeout: QR Code expirou");
      }
    }, 300000);
  };

  const sendTestMessage = async () => {
    try {
      // Obter número conectado
      const { data: statusData } = await supabase.functions.invoke('whatsapp-status');
      
      if (!statusData?.phone_number) {
        updateStepStatus('test', 'error');
        toast.error("Número do WhatsApp não encontrado");
        return;
      }

      const testPhone = statusData.phone_number.replace(/[@\w.]+$/, '');
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phone: testPhone,
          message: "🎉 Parabéns! Seu WhatsApp Business foi conectado com sucesso!\n\nO sistema está pronto para enviar notificações de agendamentos."
        }
      });

      if (error) {
        updateStepStatus('test', 'error');
        toast.error("Erro ao enviar mensagem de teste");
        return;
      }

      updateStepStatus('test', 'completed');
      toast.success("🎉 WhatsApp configurado com sucesso!");
      
    } catch (error) {
      updateStepStatus('test', 'error');
      toast.error("Erro no teste de mensagem");
    }
  };

  const getStepIcon = (step: WizardStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'error':
        return <Circle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assistente de Configuração WhatsApp</CardTitle>
        <CardDescription>
          Configure seu WhatsApp Business em 4 passos simples
        </CardDescription>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border ${
                index === currentStep ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {getStepIcon(step)}
              <div className="flex-1">
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {step.status === 'completed' && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Concluído
                </Badge>
              )}
              {step.status === 'loading' && (
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  Em andamento...
                </Badge>
              )}
              {step.status === 'error' && (
                <Badge variant="destructive">
                  Erro
                </Badge>
              )}
            </div>
          ))}
        </div>

        {qrCode && currentStep === 2 && (
          <div className="text-center space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="bg-white p-4 rounded-lg border inline-block">
              <img 
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48"
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>📱 Abra o WhatsApp no seu celular</strong></p>
              <p>⚙️ Vá em Configurações → Aparelhos conectados</p>
              <p>📷 Toque em "Conectar um aparelho" e escaneie o código</p>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          {completedSteps === 0 && (
            <Button onClick={startWizard} size="lg">
              <Settings className="h-4 w-4 mr-2" />
              Iniciar Configuração
            </Button>
          )}
          {completedSteps === steps.length && (
            <Button onClick={startWizard} variant="outline" size="lg">
              <CheckCircle className="h-4 w-4 mr-2" />
              Reconfigurar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConnectionWizard;