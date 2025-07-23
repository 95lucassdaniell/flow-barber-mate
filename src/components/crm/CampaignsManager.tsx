import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  BarChart3,
  Calendar,
  MessageCircle
} from "lucide-react";

const CampaignsManager = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Mock data para demonstração
  const campaigns = [
    {
      id: 1,
      name: "Reativação - Clientes Inativos",
      status: "active",
      type: "reactivation",
      sentCount: 25,
      openRate: 76,
      responseRate: 32,
      createdAt: "2024-01-15",
      targetSegment: "Em Risco"
    },
    {
      id: 2,
      name: "Boas-vindas - Novos Clientes",
      status: "completed",
      type: "welcome",
      sentCount: 18,
      openRate: 94,
      responseRate: 67,
      createdAt: "2024-01-10",
      targetSegment: "Novos Clientes"
    },
    {
      id: 3,
      name: "Promoção VIP - Desconto Especial",
      status: "scheduled",
      type: "promotion",
      sentCount: 0,
      openRate: 0,
      responseRate: 0,
      createdAt: "2024-01-20",
      targetSegment: "Clientes VIP"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Send className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "scheduled":
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa";
      case "completed":
        return "Concluída";
      case "scheduled":
        return "Agendada";
      default:
        return "Rascunho";
    }
  };

  const CreateCampaignForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Nova Campanha</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nome da Campanha</label>
          <Input placeholder="Ex: Promoção Fevereiro 2024" />
        </div>
        
        <div>
          <label className="text-sm font-medium">Segmento Alvo</label>
          <select className="w-full p-2 border rounded-md">
            <option>Clientes VIP</option>
            <option>Em Risco</option>
            <option>Novos Clientes</option>
            <option>Frequentes</option>
            <option>Sazonais</option>
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Tipo de Campanha</label>
          <select className="w-full p-2 border rounded-md">
            <option>Promoção</option>
            <option>Reativação</option>
            <option>Boas-vindas</option>
            <option>Lembrete</option>
            <option>Pesquisa</option>
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Mensagem</label>
          <Textarea 
            placeholder="Digite sua mensagem aqui... Use {{nome}} para personalizar"
            rows={4}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={() => setShowCreateForm(false)} variant="outline">
            Cancelar
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Criar Campanha
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Campanhas</h2>
          <p className="text-muted-foreground">
            Gerencie campanhas de marketing e comunicação com clientes
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">43</div>
                <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-sm text-muted-foreground">Taxa de Abertura</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">49%</div>
                <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">12</div>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Criação */}
      {showCreateForm && <CreateCampaignForm />}

      {/* Lista de Campanhas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Campanhas Recentes</h3>
        
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold">{campaign.name}</h4>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1">{getStatusText(campaign.status)}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Segmento:</span> {campaign.targetSegment}
                    </div>
                    <div>
                      <span className="font-medium">Enviadas:</span> {campaign.sentCount}
                    </div>
                    <div>
                      <span className="font-medium">Abertura:</span> {campaign.openRate}%
                    </div>
                    <div>
                      <span className="font-medium">Resposta:</span> {campaign.responseRate}%
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Relatório
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="h-3 w-3 mr-1" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Templates de Campanha */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de Campanha</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use templates prontos para criar campanhas rapidamente
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Reativação</div>
                <div className="text-xs text-muted-foreground">Para clientes inativos</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <MessageCircle className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Boas-vindas</div>
                <div className="text-xs text-muted-foreground">Para novos clientes</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Calendar className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Lembrete</div>
                <div className="text-xs text-muted-foreground">Agendamento regular</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignsManager;