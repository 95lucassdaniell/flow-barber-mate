import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, QrCode, Smartphone, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cacheManager } from "@/lib/globalState";

interface WhatsAppConfigProps {
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

const WhatsAppConfig: React.FC<WhatsAppConfigProps> = ({ isConnected, setIsConnected }) => {
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceStatus, setInstanceStatus] = useState<string>('disconnected');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null);
  const [settings, setSettings] = useState({
    businessName: "",
    autoReply: false,
    autoReplyMessage: "Olá! Obrigado por entrar em contato. Em breve responderemos sua mensagem.",
  });
  const [notifications, setNotifications] = useState({
    appointmentConfirmation: true,
    appointmentReminder24h: true,
    appointmentReminder1h: true,
    appointmentCancellation: true,
  });

  useEffect(() => {
    checkConnectionStatus();
    loadSettings();
    
    // Setup intelligent polling (30 seconds instead of 3)
    const interval = setInterval(() => {
      if (!document.hidden && !checkingStatus) {
        checkConnectionStatus();
      }
    }, 30000);
    
    setStatusInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkingStatus]);

  const checkConnectionStatus = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (checkingStatus) return;
    
    // Check cache first (5 minute TTL)
    const cacheKey = 'whatsapp_connection_status';
    const cachedStatus = cacheManager.get<{status: string, connected: boolean, phone_number: string | null}>(cacheKey);
    if (cachedStatus) {
      setInstanceStatus(cachedStatus.status);
      setIsConnected(cachedStatus.connected);
      setPhoneNumber(cachedStatus.phone_number);
      return;
    }
    
    setCheckingStatus(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('user_id', user.user.id)
        .single();

      if (!profile?.barbershop_id) return;

      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .single();

      if (instanceError) {
        console.error('Error checking instance:', instanceError);
        return;
      }

      // Auto-configuration only if needed
      if (instance && instance.status === 'pending_configuration') {
        console.log('Instance pending configuration, triggering auto-configurator...');
        
        try {
          const { data: autoConfigResult, error: autoConfigError } = await supabase.functions.invoke(
            'whatsapp-auto-configurator'
          );
          
          if (autoConfigError) {
            console.error('Auto-configurator error:', autoConfigError);
          } else {
            console.log('Auto-configurator result:', autoConfigResult);
            // Delay next check to allow configuration
            setTimeout(() => checkConnectionStatus(), 5000);
            return;
          }
        } catch (error) {
          console.error('Error calling auto-configurator:', error);
        }
      }

      // Check status with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Status check timeout')), 10000);
      });
      
      const statusPromise = supabase.functions.invoke('whatsapp-status');
      
      const { data, error } = await Promise.race([statusPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('Error checking status:', error);
        return;
      }

      const statusData = {
        status: data.status,
        connected: data.connected,
        phone_number: data.phone_number
      };
      
      // Cache the result for 5 minutes
      cacheManager.set(cacheKey, statusData, 300000);
      
      setInstanceStatus(data.status);
      setIsConnected(data.connected);
      setPhoneNumber(data.phone_number);
      
    } catch (error) {
      console.error('Error checking connection status:', error);
      // In case of error, don't update the UI to avoid flickering
    } finally {
      setCheckingStatus(false);
    }
  }, [checkingStatus, setIsConnected]);

  const loadSettings = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('user_id', user.user.id)
        .single();

      if (!profile?.barbershop_id) return;

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('business_name, auto_reply, auto_reply_message, notification_settings')
        .eq('barbershop_id', profile.barbershop_id)
        .single();

      if (data) {
        setSettings({
          businessName: data.business_name || "",
          autoReply: data.auto_reply || false,
          autoReplyMessage: data.auto_reply_message || "Olá! Obrigado por entrar em contato. Em breve responderemos sua mensagem.",
        });
        const notificationSettings = data.notification_settings as any;
        if (notificationSettings) {
          setNotifications({
            appointmentConfirmation: notificationSettings.appointmentConfirmation ?? true,
            appointmentReminder24h: notificationSettings.appointmentReminder24h ?? true,
            appointmentReminder1h: notificationSettings.appointmentReminder1h ?? true,
            appointmentCancellation: notificationSettings.appointmentCancellation ?? true,
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const generateQRCode = async () => {
    setQrLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-connect');
      
      if (error) {
        toast.error("Erro ao gerar QR Code");
        return;
      }

      setQrCode(data.qr_code);
      setInstanceStatus(data.status);
      
      // Start checking status periodically with optimized timing
      let qrStatusInterval: NodeJS.Timeout;
      let timeoutId: NodeJS.Timeout;

      const startStatusCheck = () => {
        qrStatusInterval = setInterval(async () => {
          if (!document.hidden && !checkingStatus) {
            await checkConnectionStatus();
            if (instanceStatus === 'connected') {
              clearInterval(qrStatusInterval);
              clearTimeout(timeoutId);
              setQrCode(null);
              toast.success("WhatsApp conectado com sucesso!");
            }
          }
        }, 5000); // Increased to 5 seconds during QR scanning

        // Clear interval after 5 minutes
        timeoutId = setTimeout(() => {
          clearInterval(qrStatusInterval);
          setQrCode(null);
          toast.info("QR Code expirou. Gere um novo código se necessário.");
        }, 300000);
      };

      startStatusCheck();

      // Cleanup function
      return () => {
        if (qrStatusInterval) clearInterval(qrStatusInterval);
        if (timeoutId) clearTimeout(timeoutId);
      };
      
    } catch (error) {
      toast.error("Erro ao conectar WhatsApp");
    } finally {
      setQrLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Get current user's barbershop_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.barbershop_id) {
        toast.error("Barbearia não encontrada");
        return;
      }

      const { error } = await supabase
        .from('whatsapp_instances')
        .update({
          business_name: settings.businessName,
          auto_reply: settings.autoReply,
          auto_reply_message: settings.autoReplyMessage,
          notification_settings: notifications,
        })
        .eq('barbershop_id', profile.barbershop_id);

      if (error) {
        console.error('Error saving settings:', error);
        toast.error("Erro ao salvar configurações");
        return;
      }
      
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conexão WhatsApp</CardTitle>
              <CardDescription>
                Conecte seu número do WhatsApp usando o QR Code
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {checkingStatus ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className={
                checkingStatus ? "text-blue-500" : 
                isConnected ? "text-green-500" : "text-red-500"
              }>
                {checkingStatus ? "Verificando..." : 
                 isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && phoneNumber ? (
            <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg">
              <Smartphone className="h-5 w-5 text-green-600" />
              <span className="text-green-700">
                WhatsApp conectado: {phoneNumber}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {qrCode ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-white rounded-lg border inline-block">
                    <img 
                      src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                      alt="QR Code WhatsApp" 
                      className="w-48 h-48"
                      onError={(e) => {
                        console.error('Error loading QR Code image:', e);
                        e.currentTarget.src = '';
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>1. Abra o WhatsApp no seu celular</p>
                    <p>2. Toque em Menu ou Configurações</p>
                    <p>3. Toque em Aparelhos conectados</p>
                    <p>4. Toque em Conectar um aparelho</p>
                    <p>5. Aponte o celular para esta tela para capturar o código</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <QrCode className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    Clique no botão abaixo para gerar o QR Code e conectar seu WhatsApp
                  </p>
                  <Button onClick={generateQRCode} disabled={qrLoading}>
                    {qrLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar QR Code
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações do Negócio</CardTitle>
          <CardDescription>
            Configure as informações da sua barbearia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nome do Negócio</Label>
            <Input
              id="businessName"
              placeholder="Minha Barbearia"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Resposta Automática</Label>
                <div className="text-sm text-muted-foreground">
                  Enviar resposta automática para novas mensagens
                </div>
              </div>
              <Switch
                checked={settings.autoReply}
                onCheckedChange={(checked) => setSettings({ ...settings, autoReply: checked })}
              />
            </div>

            {settings.autoReply && (
              <div className="space-y-2">
                <Label htmlFor="autoReplyMessage">Mensagem de Resposta Automática</Label>
                <Input
                  id="autoReplyMessage"
                  placeholder="Olá! Obrigado por entrar em contato..."
                  value={settings.autoReplyMessage}
                  onChange={(e) => setSettings({ ...settings, autoReplyMessage: e.target.value })}
                />
              </div>
            )}
          </div>

          <Button onClick={saveSettings} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Notificação</CardTitle>
          <CardDescription>
            Configure quando e como enviar notificações automáticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confirmação de Agendamento</Label>
                <div className="text-sm text-muted-foreground">
                  Enviar confirmação quando um agendamento for criado
                </div>
              </div>
              <Switch
                checked={notifications.appointmentConfirmation}
                onCheckedChange={(checked) => setNotifications({ ...notifications, appointmentConfirmation: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Lembrete 24h antes</Label>
                <div className="text-sm text-muted-foreground">
                  Enviar lembrete 24 horas antes do agendamento
                </div>
              </div>
              <Switch
                checked={notifications.appointmentReminder24h}
                onCheckedChange={(checked) => setNotifications({ ...notifications, appointmentReminder24h: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Lembrete 1h antes</Label>
                <div className="text-sm text-muted-foreground">
                  Enviar lembrete 1 hora antes do agendamento
                </div>
              </div>
              <Switch
                checked={notifications.appointmentReminder1h}
                onCheckedChange={(checked) => setNotifications({ ...notifications, appointmentReminder1h: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cancelamento de Agendamento</Label>
                <div className="text-sm text-muted-foreground">
                  Notificar quando um agendamento for cancelado
                </div>
              </div>
              <Switch
                checked={notifications.appointmentCancellation}
                onCheckedChange={(checked) => setNotifications({ ...notifications, appointmentCancellation: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
          <CardDescription>
            Guia rápido para usar o WhatsApp na sua barbearia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Conectar WhatsApp</h4>
              <p className="text-muted-foreground">
                Use o QR Code acima para conectar seu número do WhatsApp
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Configurar Automações</h4>
              <p className="text-muted-foreground">
                Ative as notificações que deseja enviar automaticamente para seus clientes
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">3. Enviar Mensagens</h4>
              <p className="text-muted-foreground">
                Use a aba "Enviar Mensagem" para comunicar-se diretamente com os clientes
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">4. Histórico</h4>
              <p className="text-muted-foreground">
                Acompanhe todas as mensagens enviadas e recebidas na aba "Histórico"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppConfig;