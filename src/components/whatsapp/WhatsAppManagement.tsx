import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Send, Brain, Activity, Settings, Bug, Wifi } from "lucide-react";
import WhatsAppConfig from "./WhatsAppConfig";
import ConversationsList from "./ConversationsList";
import ConversationTestPanel from "./ConversationTestPanel";
import MessageTemplates from "./MessageTemplates";
import SendMessage from "./SendMessage";
import AIStatusDashboard from "./AIStatusDashboard";
import WhatsAppAttendance from "./WhatsAppAttendance";
import WhatsAppConnectionWizard from "./WhatsAppConnectionWizard";
import EvolutionApiTester from "./EvolutionApiTester";
import EvolutionApiConfig from "./EvolutionApiConfig";
import { EvolutionDebugPanel } from "./EvolutionDebugPanel";
import WhatsAppHealthMonitor from "./WhatsAppHealthMonitor";
import WhatsAppSystemRecovery from "./WhatsAppSystemRecovery";

const WhatsAppManagement = () => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Business</h1>
          <p className="text-muted-foreground">
            Gerencie comunicação com clientes via WhatsApp
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "Conectado" : "Desconectado"}
        </Badge>
      </div>

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Conexão
          </TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="send">Enviar</TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            IA
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <WhatsAppConnectionWizard />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <WhatsAppConfig 
            isConnected={isConnected} 
            setIsConnected={setIsConnected} 
          />
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <div className="space-y-6">
            <ConversationTestPanel />
            <WhatsAppAttendance />
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <MessageTemplates />
        </TabsContent>

        <TabsContent value="send" className="space-y-6">
          <SendMessage isConnected={isConnected} />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assistente IA WhatsApp</CardTitle>
                <CardDescription>
                  Configuração e monitoramento da IA para WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  O assistente de IA será configurado automaticamente após conectar o WhatsApp.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <WhatsAppHealthMonitor />
        </TabsContent>

        <TabsContent value="recovery" className="space-y-6">
          <WhatsAppSystemRecovery />
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <EvolutionApiTester />
          <EvolutionApiConfig />
        </TabsContent>

        <TabsContent value="debug" className="space-y-6">
          <EvolutionDebugPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppManagement;