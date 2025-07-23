import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Settings, Send, History, Plus } from "lucide-react";
import WhatsAppConfig from "./WhatsAppConfig";
import MessageTemplates from "./MessageTemplates";
import SendMessage from "./SendMessage";
import MessageHistory from "./MessageHistory";

const WhatsAppManagement = () => {
  const [activeTab, setActiveTab] = useState("config");
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
        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">Status da Integração</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected 
                    ? "WhatsApp Business API conectado e funcionando"
                    : "Configure a API do WhatsApp Business para começar"
                  }
                </p>
              </div>
            </div>
            {!isConnected && (
              <Button onClick={() => setActiveTab("config")}>
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Enviar
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <WhatsAppConfig 
            isConnected={isConnected} 
            setIsConnected={setIsConnected} 
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <MessageTemplates />
        </TabsContent>

        <TabsContent value="send" className="space-y-6">
          <SendMessage isConnected={isConnected} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <MessageHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppManagement;