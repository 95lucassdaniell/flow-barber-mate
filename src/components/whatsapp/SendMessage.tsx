import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/useClients";
import { Send, AlertCircle, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SendMessageProps {
  isConnected: boolean;
}

const SendMessage = ({ isConnected }: SendMessageProps) => {
  const { toast } = useToast();
  const { clients } = useClients();
  const [loading, setLoading] = useState(false);
  
  const [messageData, setMessageData] = useState({
    recipients: 'single' as 'single' | 'multiple' | 'all',
    selectedClient: '',
    phoneNumber: '',
    message: '',
    template: ''
  });

  const templates = [
    {
      id: '1',
      name: 'Boas-vindas',
      content: 'Olá! Bem-vindo à nossa barbearia. Como podemos ajudá-lo hoje?'
    },
    {
      id: '2', 
      name: 'Promoção',
      content: 'Oi! Temos uma promoção especial hoje: 20% de desconto em todos os serviços. Aproveite!'
    },
    {
      id: '3',
      name: 'Horário de Funcionamento',
      content: 'Olá! Nosso horário de funcionamento é de segunda a sábado, das 9h às 18h. Domingo fechado.'
    }
  ];

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-numeric characters
    return phone.replace(/\D/g, '');
  };

  const validatePhoneNumber = (phone: string) => {
    const cleaned = formatPhoneNumber(phone);
    // Brazilian phone numbers should have 10-11 digits
    return cleaned.length >= 10 && cleaned.length <= 11;
  };

  const sendSingleMessage = async (phone: string) => {
    const formattedPhone = formatPhoneNumber(phone);
    
    if (!validatePhoneNumber(phone)) {
      throw new Error(`Número de telefone inválido: ${phone}`);
    }

    const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        phone: formattedPhone,
        message: messageData.message,
        messageType: 'text'
      }
    });

    if (error) {
      throw new Error(`Erro ao enviar para ${phone}: ${error.message}`);
    }

    return data;
  };

  const handleSend = async () => {
    if (!isConnected) {
      toast({
        title: "WhatsApp não conectado",
        description: "Configure a integração do WhatsApp primeiro.",
        variant: "destructive",
      });
      return;
    }

    if (!messageData.message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem para enviar.",
        variant: "destructive",
      });
      return;
    }

    if (messageData.message.length > 4096) {
      toast({
        title: "Mensagem muito longa",
        description: "A mensagem deve ter no máximo 4096 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (messageData.recipients === 'single' && !messageData.selectedClient && !messageData.phoneNumber) {
      toast({
        title: "Destinatário não selecionado",
        description: "Selecione um cliente ou digite um número de telefone.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      if (messageData.recipients === 'single') {
        // Single recipient
        let phone = '';
        if (messageData.selectedClient) {
          const client = clients.find(c => c.id === messageData.selectedClient);
          phone = client?.phone || '';
        } else {
          phone = messageData.phoneNumber;
        }

        if (!phone) {
          throw new Error('Número de telefone não encontrado');
        }

        await sendSingleMessage(phone);
        successCount = 1;
      } else if (messageData.recipients === 'all') {
        // All clients with valid phone numbers
        const clientsWithPhone = clients.filter(client => 
          client.phone && validatePhoneNumber(client.phone)
        );

        if (clientsWithPhone.length === 0) {
          throw new Error('Nenhum cliente com número de telefone válido encontrado');
        }

        // Send to all clients with rate limiting
        for (const client of clientsWithPhone) {
          try {
            await sendSingleMessage(client.phone);
            successCount++;
            // Rate limiting: wait 1 second between messages
            if (successCount < clientsWithPhone.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            errorCount++;
            errors.push(`${client.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Mensagens enviadas",
          description: `${successCount} ${successCount === 1 ? 'mensagem enviada' : 'mensagens enviadas'} com sucesso.${errorCount > 0 ? ` ${errorCount} falharam.` : ''}`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Erro ao enviar",
          description: errors.length > 0 ? errors[0] : "Erro ao enviar as mensagens.",
          variant: "destructive",
        });
      }

      // Reset form only if at least one message was sent successfully
      if (successCount > 0) {
        setMessageData({
          recipients: 'single',
          selectedClient: '',
          phoneNumber: '',
          message: '',
          template: ''
        });
      }

    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: error instanceof Error ? error.message : "Erro ao enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessageData(prev => ({ ...prev, message: template.content, template: templateId }));
    }
  };

  const getSelectedClient = () => {
    return clients.find(c => c.id === messageData.selectedClient);
  };

  return (
    <div className="space-y-6">
      {!isConnected && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-medium text-orange-800 dark:text-orange-200">
                  WhatsApp não conectado
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Configure a integração do WhatsApp na aba "Configuração" para enviar mensagens.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Enviar Mensagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recipient Selection */}
          <div className="space-y-4">
            <Label>Destinatários</Label>
            <Select
              value={messageData.recipients}
              onValueChange={(value: 'single' | 'multiple' | 'all') => 
                setMessageData(prev => ({ ...prev, recipients: value, selectedClient: '', phoneNumber: '' }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Cliente específico</SelectItem>
                <SelectItem value="multiple">Múltiplos clientes</SelectItem>
                <SelectItem value="all">Todos os clientes</SelectItem>
              </SelectContent>
            </Select>

            {messageData.recipients === 'single' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Selecionar Cliente</Label>
                  <Select
                    value={messageData.selectedClient}
                    onValueChange={(value) => setMessageData(prev => ({ ...prev, selectedClient: value, phoneNumber: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ou digite o número</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={messageData.phoneNumber}
                    onChange={(e) => setMessageData(prev => ({ ...prev, phoneNumber: e.target.value, selectedClient: '' }))}
                    disabled={!!messageData.selectedClient}
                  />
                </div>
              </div>
            )}

            {messageData.recipients === 'all' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Enviar para todos os {clients.length} clientes cadastrados
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Esta ação enviará a mensagem para todos os clientes que possuem número de WhatsApp.
                </p>
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template (opcional)</Label>
            <Select
              value={messageData.template}
              onValueChange={handleTemplateSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem..."
              rows={4}
              value={messageData.message}
              onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Caracteres: {messageData.message.length}</span>
              <span>Limite: 4096 caracteres</span>
            </div>
          </div>

          {/* Preview */}
          {(messageData.selectedClient || messageData.phoneNumber || messageData.recipients !== 'single') && messageData.message && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    B
                  </div>
                  <div className="flex-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <p className="whitespace-pre-wrap">{messageData.message}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Para: {
                        messageData.selectedClient 
                          ? getSelectedClient()?.name
                          : messageData.phoneNumber 
                            ? messageData.phoneNumber
                            : messageData.recipients === 'all' 
                              ? `${clients.length} clientes`
                              : 'Múltiplos clientes'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSend} 
              disabled={loading || !isConnected || !messageData.message.trim()}
              className="min-w-32"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {loading ? "Enviando..." : "Enviar Mensagem"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendMessage;