import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Scissors, 
  MessageCircle,
  Star,
  TrendingUp,
  Clock,
  Heart,
  Gift,
  ArrowLeft
} from "lucide-react";
import ClientTimeline from "./ClientTimeline";
import { Client } from "@/hooks/useClients";

interface ClientProfileProps {
  client: Client;
  onBack: () => void;
}

const ClientProfile = ({ client, onBack }: ClientProfileProps) => {
  // Mock data para demonstração - em produção, viria de hooks específicos
  const clientStats = {
    totalSpent: 850,
    totalAppointments: 12,
    avgSpentPerVisit: 71,
    lastVisit: "2024-01-15",
    nextPredicted: "2024-02-05",
    favoriteBarber: "João Silva",
    favoriteServices: ["Corte Masculino", "Barba"],
    satisfaction: 4.8,
    lifetimeValue: 1200,
    riskScore: "Baixo",
    frequency: "Regular"
  };

  const preferences = {
    preferredTime: "Manhã (09:00-12:00)",
    preferredDays: ["Terça", "Quinta", "Sábado"],
    notifications: {
      whatsapp: true,
      email: false,
      sms: false
    },
    specialRequests: [
      "Prefere corte mais conservador",
      "Alérgico a produtos com álcool",
      "Gosta de conversar sobre esportes"
    ]
  };

  const upcomingOpportunities = [
    {
      type: "birthday",
      title: "Aniversário em 15 dias",
      description: "Oportunidade para campanha especial",
      action: "Enviar felicitações + desconto"
    },
    {
      type: "service",
      title: "Devido para corte",
      description: "Última visita há 18 dias",
      action: "Enviar lembrete de agendamento"
    },
    {
      type: "upsell",
      title: "Oportunidade de upsell",
      description: "Nunca experimentou tratamento de barba",
      action: "Sugerir serviço adicional"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">
            Cliente desde {new Date(client.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button>
          <MessageCircle className="h-4 w-4 mr-2" />
          Enviar Mensagem
        </Button>
      </div>

      {/* Dados Pessoais e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Informações Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
            {client.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {client.birth_date && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(client.birth_date).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            <div className="pt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Cliente {clientStats.frequency}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Métricas Financeiras</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {clientStats.totalSpent}
                </div>
                <p className="text-xs text-muted-foreground">Total Gasto</p>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  R$ {clientStats.avgSpentPerVisit}
                </div>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                R$ {clientStats.lifetimeValue}
              </div>
              <p className="text-xs text-muted-foreground">Lifetime Value Estimado</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Engajamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Satisfação</span>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{clientStats.satisfaction}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Visitas Totais</span>
              <span className="font-semibold">{clientStats.totalAppointments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Risco de Churn</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {clientStats.riskScore}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com informações detalhadas */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <ClientTimeline clientId={client.id} />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Horário Preferido</h4>
                  <p className="text-sm text-muted-foreground">{preferences.preferredTime}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Dias da Semana</h4>
                  <div className="flex flex-wrap gap-2">
                    {preferences.preferredDays.map((day) => (
                      <Badge key={day} variant="secondary">{day}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Barbeiro Preferido</h4>
                  <p className="text-sm text-muted-foreground">{clientStats.favoriteBarber}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Serviços e Observações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Serviços Favoritos</h4>
                  <div className="flex flex-wrap gap-2">
                    {clientStats.favoriteServices.map((service) => (
                      <Badge key={service} variant="outline">{service}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Observações Especiais</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {preferences.specialRequests.map((request, index) => (
                      <li key={index}>• {request}</li>
                    ))}
                  </ul>
                </div>
                {client.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notas do Cliente</h4>
                    <p className="text-sm text-muted-foreground">{client.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
            {upcomingOpportunities.map((opportunity, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {opportunity.type === "birthday" && <Gift className="h-4 w-4 text-purple-600" />}
                        {opportunity.type === "service" && <Clock className="h-4 w-4 text-orange-600" />}
                        {opportunity.type === "upsell" && <TrendingUp className="h-4 w-4 text-green-600" />}
                        <h4 className="font-medium">{opportunity.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{opportunity.description}</p>
                      <p className="text-sm font-medium text-blue-600">{opportunity.action}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Executar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Padrões de Comportamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Frequência de Visitas</span>
                  <span className="font-semibold">A cada 21 dias</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sazonalidade</span>
                  <span className="font-semibold">Menos ativo no verão</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Melhor Dia</span>
                  <span className="font-semibold">Sábado</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Horário Preferido</span>
                  <span className="font-semibold">10:00 - 11:00</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comunicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mensagens Enviadas</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxa de Resposta</span>
                  <span className="font-semibold">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Canal Preferido</span>
                  <span className="font-semibold">WhatsApp</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Última Interação</span>
                  <span className="font-semibold">3 dias atrás</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientProfile;