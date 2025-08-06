import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageSquare, Calendar, Clock, Ban, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WhatsAppAutomationTester = () => {
  const [testLoading, setTestLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  const sendTestAutomation = async (type: string) => {
    if (!testPhone) {
      toast.error("Digite um número de telefone para teste");
      return;
    }

    setTestLoading(true);
    try {
      let message = '';
      
      switch (type) {
        case 'confirmation':
          message = '🎉 Agendamento Confirmado!\n\nSeu agendamento foi confirmado:\n📅 Data: 07/08/2025\n⏰ Horário: 14:00\n💁‍♂️ Barbeiro: João\n✂️ Serviço: Corte + Barba\n\nAguardamos você!';
          break;
        case 'reminder24h':
          message = '⏰ Lembrete de Agendamento\n\nOlá! Lembrete que você tem um agendamento amanhã:\n📅 Data: 07/08/2025\n⏰ Horário: 14:00\n💁‍♂️ Barbeiro: João\n\nAté amanhã!';
          break;
        case 'reminder1h':
          message = '🔔 Seu agendamento é daqui a 1 hora!\n\n📅 Hoje às 14:00\n💁‍♂️ Barbeiro: João\n📍 Não se esqueça!\n\nTe esperamos!';
          break;
        case 'cancellation':
          message = '❌ Agendamento Cancelado\n\nSeu agendamento foi cancelado:\n📅 Data: 07/08/2025\n⏰ Horário: 14:00\n\nPara reagendar, entre em contato conosco.';
          break;
        default:
          message = '👋 Mensagem de teste do sistema WhatsApp Business';
      }

      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phone: testPhone,
          message: message
        }
      });

      if (error) {
        toast.error(`Erro ao enviar ${type}: ${error.message}`);
        return;
      }

      toast.success(`Teste de ${type} enviado com sucesso!`);
    } catch (error) {
      console.error('Error sending test automation:', error);
      toast.error(`Erro ao enviar teste de ${type}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testar Automações WhatsApp</CardTitle>
        <CardDescription>
          Teste os diferentes tipos de mensagens automáticas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="testPhone">Número para Teste</Label>
          <Input
            id="testPhone"
            placeholder="5562999999999"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            type="tel"
          />
          <p className="text-xs text-muted-foreground">
            Use o formato: 5562999999999 (sem espaços ou símbolos)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => sendTestAutomation('confirmation')}
            disabled={testLoading || !testPhone}
            className="h-20 flex-col space-y-2"
          >
            {testLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Calendar className="h-5 w-5" />
                <span className="text-sm">Confirmação</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => sendTestAutomation('reminder24h')}
            disabled={testLoading || !testPhone}
            className="h-20 flex-col space-y-2"
          >
            {testLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Clock className="h-5 w-5" />
                <span className="text-sm">Lembrete 24h</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => sendTestAutomation('reminder1h')}
            disabled={testLoading || !testPhone}
            className="h-20 flex-col space-y-2"
          >
            {testLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm">Lembrete 1h</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => sendTestAutomation('cancellation')}
            disabled={testLoading || !testPhone}
            className="h-20 flex-col space-y-2"
          >
            {testLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Ban className="h-5 w-5" />
                <span className="text-sm">Cancelamento</span>
              </>
            )}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
          <p><strong>💡 Dica:</strong> Use estes testes para verificar se as automações estão funcionando corretamente antes de ativá-las para todos os clientes.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppAutomationTester;