import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBarbershopBySlug } from '@/hooks/useBarbershopBySlug';
import { MessageSquare, Plus, Send, Phone, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

const ConversationTestPanel = () => {
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const { barbershop } = useBarbershopBySlug(slug || '');
  
  // Use barbershop_id from profile or fallback to barbershop from slug
  const barbershopId = profile?.barbershop_id || barbershop?.id;

  const createTestConversation = async () => {
    if (!testPhone.trim() || !barbershopId) return;

    setIsCreating(true);
    try {
      const formattedPhone = testPhone.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .upsert({
          barbershop_id: barbershopId,
          client_phone: formattedPhone,
          client_name: `Cliente Teste ${formattedPhone.slice(-4)}`,
          last_message_at: new Date().toISOString(),
          ai_enabled: true,
          human_takeover: false
        }, {
          onConflict: 'barbershop_id,client_phone'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Conversa criada!",
        description: `Conversa de teste criada para ${formattedPhone}`,
      });

      setTestPhone('');
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conversa de teste",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone.trim() || !testMessage.trim() || !barbershopId) return;

    setIsSending(true);
    try {
      const formattedPhone = testPhone.replace(/\D/g, '');
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phone: formattedPhone,
          message: testMessage,
          barbershop_id: barbershopId
        }
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada!",
        description: `Mensagem enviada para ${formattedPhone}`,
      });

      setTestMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Painel de Teste de Conversas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!barbershopId && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Aguardando autenticação...</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              O sistema está carregando as informações da barbearia. Aguarde um momento.
            </p>
          </div>
        )}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Criar Conversa de Teste</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Crie uma conversa de teste para validar o sistema sem precisar receber mensagens reais.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: 62999999999"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={createTestConversation}
              disabled={!testPhone.trim() || isCreating || !barbershopId}
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreating ? 'Criando...' : 'Criar Conversa'}
            </Button>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Enviar Mensagem de Teste</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Envie uma mensagem de teste que criará automaticamente uma conversa se não existir.
          </p>
          <div className="space-y-2">
            <Input
              placeholder="Número do telefone (ex: 62999999999)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Textarea
              placeholder="Digite sua mensagem de teste..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
            />
            <Button
              onClick={sendTestMessage}
              disabled={!testPhone.trim() || !testMessage.trim() || isSending || !barbershopId}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Enviando...' : 'Enviar Mensagem de Teste'}
            </Button>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Como Testar</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Use um número de telefone válido (com DDD)</li>
            <li>Crie uma conversa de teste ou envie uma mensagem</li>
            <li>A conversa aparecerá automaticamente na lista</li>
            <li>Teste o assumir controle e envio de mensagens</li>
            <li>Para testes reais, envie uma mensagem do WhatsApp para o número conectado</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationTestPanel;