import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, TestTube, AlertCircle, CheckCircle } from "lucide-react";

interface WhatsAppConfigProps {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

const WhatsAppConfig = ({ isConnected, setIsConnected }: WhatsAppConfigProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [config, setConfig] = useState({
    apiUrl: "",
    accessToken: "",
    phoneNumberId: "",
    webhookVerifyToken: "",
    businessName: "",
    autoReply: true,
    notifications: {
      newAppointment: true,
      appointmentReminder: true,
      appointmentConfirmation: true,
      cancellation: true,
    }
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: "As configurações do WhatsApp foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      toast({
        title: "Teste realizado com sucesso",
        description: "Conexão com WhatsApp Business API estabelecida.",
      });
    } catch (error) {
      toast({
        title: "Falha no teste",
        description: "Não foi possível conectar com a API. Verifique as configurações.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-600" />
            )}
            Configuração da API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">URL da API</Label>
              <Input
                id="apiUrl"
                placeholder="https://graph.facebook.com/v17.0"
                value={config.apiUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="EAAxxxxxxxxxxxxx"
                value={config.accessToken}
                onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">Phone Number ID</Label>
              <Input
                id="phoneNumberId"
                placeholder="123456789012345"
                value={config.phoneNumberId}
                onChange={(e) => setConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
              <Input
                id="webhookVerifyToken"
                placeholder="meu_token_verificacao"
                value={config.webhookVerifyToken}
                onChange={(e) => setConfig(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName">Nome do Negócio</Label>
            <Input
              id="businessName"
              placeholder="Minha Barbearia"
              value={config.businessName}
              onChange={(e) => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="autoReply">Resposta Automática</Label>
              <Switch
                id="autoReply"
                checked={config.autoReply}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoReply: checked }))}
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTest} disabled={testing}>
                <TestTube className="w-4 h-4 mr-2" />
                {testing ? "Testando..." : "Testar Conexão"}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Novo Agendamento</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar cliente quando um agendamento for criado
                </p>
              </div>
              <Switch
                checked={config.notifications.newAppointment}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, newAppointment: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Lembrete de Agendamento</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar lembrete 1 hora antes do agendamento
                </p>
              </div>
              <Switch
                checked={config.notifications.appointmentReminder}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, appointmentReminder: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Confirmação de Agendamento</Label>
                <p className="text-sm text-muted-foreground">
                  Solicitar confirmação do cliente
                </p>
              </div>
              <Switch
                checked={config.notifications.appointmentConfirmation}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, appointmentConfirmation: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Cancelamento</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar sobre cancelamentos
                </p>
              </div>
              <Switch
                checked={config.notifications.cancellation}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ 
                    ...prev, 
                    notifications: { ...prev.notifications, cancellation: checked }
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Como Configurar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Criar uma Conta Meta for Developers</h4>
              <p className="text-muted-foreground">
                Acesse developers.facebook.com e crie uma conta Meta for Developers
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Criar um App WhatsApp Business</h4>
              <p className="text-muted-foreground">
                No painel do Meta for Developers, crie um novo app e adicione o produto WhatsApp Business
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Obter Credenciais</h4>
              <p className="text-muted-foreground">
                Copie o Access Token e Phone Number ID do painel do WhatsApp Business
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. Configurar Webhook</h4>
              <p className="text-muted-foreground">
                Configure o webhook URL para receber mensagens: {window.location.origin}/api/whatsapp/webhook
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppConfig;