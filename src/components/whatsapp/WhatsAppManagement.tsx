import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WhatsAppConfig from "./WhatsAppConfig";
import ConversationsList from "./ConversationsList";
import MessageTemplates from "./MessageTemplates";
import SendMessage from "./SendMessage";
import AIStatusDashboard from "./AIStatusDashboard";
import EvolutionApiTester from "./EvolutionApiTester";
import EvolutionApiConfig from "./EvolutionApiConfig";
import { EvolutionDebugPanel } from "./EvolutionDebugPanel";

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

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="send">Enviar</TabsTrigger>
          <TabsTrigger value="ai">IA</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <WhatsAppConfig 
            isConnected={isConnected} 
            setIsConnected={setIsConnected} 
          />
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <div className="p-4">
            <p className="text-muted-foreground">
              Use a aba Debug para diagnosticar problemas com as conversas do WhatsApp.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <MessageTemplates />
        </TabsContent>

        <TabsContent value="send" className="space-y-6">
          <SendMessage isConnected={isConnected} />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="p-4">
            <p className="text-muted-foreground">
              Dashboard de IA será implementado após a resolução dos problemas de conectividade.
            </p>
          </div>
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