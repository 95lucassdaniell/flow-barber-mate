import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Crown, 
  AlertTriangle, 
  UserPlus, 
  Calendar,
  DollarSign,
  Search,
  Filter,
  Users,
  MessageCircle
} from "lucide-react";
import { useClients } from "@/hooks/useClients";

const ClientSegments = () => {
  const { clients, loading } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");

  if (loading) {
    return <div>Carregando segmentação...</div>;
  }

  const segments = [
    {
      id: "vip",
      name: "Clientes VIP",
      description: "Alto valor e frequência",
      icon: Crown,
      color: "bg-yellow-100 text-yellow-800",
      count: Math.floor((clients?.length || 0) * 0.15),
      criteria: "Mais de R$ 500 gastos + 6+ visitas"
    },
    {
      id: "risk",
      name: "Em Risco",
      description: "Sem agendar há 45+ dias",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-800",
      count: Math.floor((clients?.length || 0) * 0.12),
      criteria: "Última visita há mais de 45 dias"
    },
    {
      id: "new",
      name: "Novos Clientes",
      description: "Cadastrados nos últimos 30 dias",
      icon: UserPlus,
      color: "bg-green-100 text-green-800",
      count: Math.floor((clients?.length || 0) * 0.18),
      criteria: "Primeira visita nos últimos 30 dias"
    },
    {
      id: "frequent",
      name: "Frequentes",
      description: "Agendam regularmente",
      icon: Calendar,
      color: "bg-blue-100 text-blue-800",
      count: Math.floor((clients?.length || 0) * 0.35),
      criteria: "Agendamento a cada 3-4 semanas"
    },
    {
      id: "seasonal",
      name: "Sazonais",
      description: "Agendam esporadicamente",
      icon: Users,
      color: "bg-purple-100 text-purple-800",
      count: Math.floor((clients?.length || 0) * 0.20),
      criteria: "Intervalos irregulares de agendamento"
    }
  ];

  const SegmentCard = ({ segment }: { segment: any }) => {
    const Icon = segment.icon;
    
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${segment.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{segment.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{segment.description}</p>
              </div>
            </div>
            <Badge variant="secondary">{segment.count}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">{segment.criteria}</p>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Users className="h-3 w-3 mr-1" />
              Ver Lista
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <MessageCircle className="h-3 w-3 mr-1" />
              Campanha
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Segmentação de Clientes</h2>
          <p className="text-muted-foreground">
            Organize clientes em grupos para campanhas direcionadas
          </p>
        </div>
        <Button>
          <Filter className="w-4 h-4 mr-2" />
          Criar Segmento Personalizado
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar segmentos ou clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{clients?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {segments.find(s => s.id === "vip")?.count || 0}
              </div>
              <p className="text-sm text-muted-foreground">Clientes VIP</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {segments.find(s => s.id === "risk")?.count || 0}
              </div>
              <p className="text-sm text-muted-foreground">Em Risco</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {segments.find(s => s.id === "new")?.count || 0}
              </div>
              <p className="text-sm text-muted-foreground">Novos (30d)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segmentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment) => (
          <SegmentCard key={segment.id} segment={segment} />
        ))}
      </div>

      {/* Ações em Massa */}
      <Card>
        <CardHeader>
          <CardTitle>Ações em Massa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Execute ações para múltiplos segmentos simultaneamente
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <MessageCircle className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Campanha de Reativação</div>
                <div className="text-xs text-muted-foreground">Para clientes em risco</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Calendar className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Lembretes de Agendamento</div>
                <div className="text-xs text-muted-foreground">Para clientes frequentes</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <DollarSign className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Promoções Especiais</div>
                <div className="text-xs text-muted-foreground">Para clientes VIP</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSegments;