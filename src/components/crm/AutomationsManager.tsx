import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Zap, 
  Clock, 
  MessageCircle, 
  Calendar, 
  Gift,
  AlertTriangle,
  TrendingUp,
  Users,
  Plus,
  Settings,
  Play,
  Pause
} from "lucide-react";

const AutomationsManager = () => {
  const [automations, setAutomations] = useState([
    {
      id: 1,
      name: "Lembrete de Agendamento",
      description: "Envia lembrete automático 24h antes do agendamento",
      type: "reminder",
      isActive: true,
      trigger: "24h antes do agendamento",
      action: "Enviar WhatsApp",
      executed: 156,
      successRate: 94
    },
    {
      id: 2,
      name: "Reativação de Clientes",
      description: "Envia mensagem para clientes inativos há 30+ dias",
      type: "reactivation",
      isActive: true,
      trigger: "30 dias sem agendamento",
      action: "Campanha de reativação",
      executed: 43,
      successRate: 67
    },
    {
      id: 3,
      name: "Follow-up Pós-Atendimento",
      description: "Pede feedback e avaliação 2 dias após o atendimento",
      type: "feedback",
      isActive: false,
      trigger: "2 dias após atendimento",
      action: "Pesquisa de satisfação",
      executed: 89,
      successRate: 78
    },
    {
      id: 4,
      name: "Promoção de Aniversário",
      description: "Envia parabéns e cupom de desconto no aniversário",
      type: "birthday",
      isActive: true,
      trigger: "Data de aniversário",
      action: "Parabéns + 15% desconto",
      executed: 24,
      successRate: 89
    },
    {
      id: 5,
      name: "Upsell Inteligente",
      description: "Sugere serviços complementares baseado no histórico",
      type: "upsell",
      isActive: false,
      trigger: "Cliente frequente",
      action: "Sugestão de serviço",
      executed: 12,
      successRate: 45
    },
    {
      id: 6,
      name: "Agendamento Recorrente",
      description: "Sugere novo agendamento baseado na frequência do cliente",
      type: "recurring",
      isActive: true,
      trigger: "Intervalo baseado no histórico",
      action: "Sugestão de reagendamento",
      executed: 78,
      successRate: 72
    }
  ]);

  const toggleAutomation = (id: number) => {
    setAutomations(prev => 
      prev.map(automation => 
        automation.id === id 
          ? { ...automation, isActive: !automation.isActive }
          : automation
      )
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-4 w-4" />;
      case "reactivation":
        return <AlertTriangle className="h-4 w-4" />;
      case "feedback":
        return <MessageCircle className="h-4 w-4" />;
      case "birthday":
        return <Gift className="h-4 w-4" />;
      case "upsell":
        return <TrendingUp className="h-4 w-4" />;
      case "recurring":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "reminder":
        return "bg-blue-100 text-blue-800";
      case "reactivation":
        return "bg-red-100 text-red-800";
      case "feedback":
        return "bg-green-100 text-green-800";
      case "birthday":
        return "bg-pink-100 text-pink-800";
      case "upsell":
        return "bg-purple-100 text-purple-800";
      case "recurring":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "reminder":
        return "Lembrete";
      case "reactivation":
        return "Reativação";
      case "feedback":
        return "Feedback";
      case "birthday":
        return "Aniversário";
      case "upsell":
        return "Upsell";
      case "recurring":
        return "Recorrente";
      default:
        return "Automação";
    }
  };

  const totalExecuted = automations.reduce((sum, auto) => sum + auto.executed, 0);
  const avgSuccessRate = automations.reduce((sum, auto) => sum + auto.successRate, 0) / automations.length;
  const activeAutomations = automations.filter(auto => auto.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Automações</h2>
          <p className="text-muted-foreground">
            Configure e monitore automações de marketing e atendimento
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{activeAutomations}</div>
                <p className="text-sm text-muted-foreground">Automações Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{totalExecuted}</div>
                <p className="text-sm text-muted-foreground">Execuções Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{avgSuccessRate.toFixed(0)}%</div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">24</div>
                <p className="text-sm text-muted-foreground">Agendamentos Gerados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Automações */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Automações Configuradas</h3>
        
        {automations.map((automation) => (
          <Card key={automation.id} className={`transition-all ${automation.isActive ? 'ring-1 ring-green-200' : 'opacity-75'}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Ícone e Tipo */}
                  <div className={`p-3 rounded-lg ${getTypeColor(automation.type)}`}>
                    {getTypeIcon(automation.type)}
                  </div>
                  
                  {/* Informações principais */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold">{automation.name}</h4>
                      <Badge variant="outline" className={getTypeColor(automation.type)}>
                        {getTypeName(automation.type)}
                      </Badge>
                      <Badge variant={automation.isActive ? "default" : "secondary"}>
                        {automation.isActive ? (
                          <><Play className="h-3 w-3 mr-1" /> Ativa</>
                        ) : (
                          <><Pause className="h-3 w-3 mr-1" /> Pausada</>
                        )}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {automation.description}
                    </p>
                    
                    {/* Detalhes da automação */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Gatilho:</span>
                        <p className="text-muted-foreground">{automation.trigger}</p>
                      </div>
                      <div>
                        <span className="font-medium">Ação:</span>
                        <p className="text-muted-foreground">{automation.action}</p>
                      </div>
                      <div>
                        <span className="font-medium">Performance:</span>
                        <p className="text-muted-foreground">
                          {automation.executed} execuções • {automation.successRate}% sucesso
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Controles */}
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={automation.isActive}
                    onCheckedChange={() => toggleAutomation(automation.id)}
                  />
                  <Button variant="outline" size="sm">
                    <Settings className="h-3 w-3 mr-1" />
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Templates de Automação */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de Automação</CardTitle>
          <p className="text-sm text-muted-foreground">
            Crie automações rapidamente usando templates pré-configurados
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Boas-vindas</div>
                <div className="text-xs text-muted-foreground">Para novos clientes</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <AlertTriangle className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Win-back</div>
                <div className="text-xs text-muted-foreground">Reconquistar clientes</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <TrendingUp className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Cross-sell</div>
                <div className="text-xs text-muted-foreground">Venda cruzada</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationsManager;