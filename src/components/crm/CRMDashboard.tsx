import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MessageCircle
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useMemo } from "react";

const CRMDashboard = () => {
  const { clients, loading } = useClients();

  const metrics = useMemo(() => {
    if (!clients) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const newClientsLast30Days = clients.filter(
      client => new Date(client.created_at) >= thirtyDaysAgo
    ).length;

    const newClientsLast60Days = clients.filter(
      client => new Date(client.created_at) >= sixtyDaysAgo &&
                new Date(client.created_at) < thirtyDaysAgo
    ).length;

    const growthRate = newClientsLast60Days > 0 
      ? ((newClientsLast30Days - newClientsLast60Days) / newClientsLast60Days) * 100 
      : newClientsLast30Days > 0 ? 100 : 0;

    // Simulando dados para demonstração
    const avgLifetimeValue = 450;
    const retentionRate = 78;
    const avgDaysBetweenVisits = 21;
    const satisfactionScore = 4.6;

    return {
      totalClients: clients.length,
      newClientsLast30Days,
      growthRate,
      avgLifetimeValue,
      retentionRate,
      avgDaysBetweenVisits,
      satisfactionScore
    };
  }, [clients]);

  if (loading) {
    return <div className="space-y-6">Carregando métricas...</div>;
  }

  if (!metrics) {
    return <div className="space-y-6">Erro ao carregar dados</div>;
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    trend, 
    icon: Icon, 
    format = "number" 
  }: {
    title: string;
    value: number;
    subtitle: string;
    trend?: number;
    icon: any;
    format?: "number" | "currency" | "percentage" | "days" | "rating";
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case "currency":
          return `R$ ${val.toFixed(0)}`;
        case "percentage":
          return `${val}%`;
        case "days":
          return `${val} dias`;
        case "rating":
          return `${val.toFixed(1)}/5`;
        default:
          return val.toString();
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          <div className="flex items-center space-x-2">
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            {trend !== undefined && (
              <Badge 
                variant={trend >= 0 ? "default" : "secondary"}
                className="text-xs"
              >
                {trend >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Clientes"
          value={metrics.totalClients}
          subtitle="Clientes cadastrados"
          icon={Users}
        />
        
        <StatCard
          title="Novos Clientes (30d)"
          value={metrics.newClientsLast30Days}
          subtitle="Crescimento mensal"
          trend={metrics.growthRate}
          icon={TrendingUp}
        />
        
        <StatCard
          title="CLV Médio"
          value={metrics.avgLifetimeValue}
          subtitle="Customer Lifetime Value"
          icon={DollarSign}
          format="currency"
        />
        
        <StatCard
          title="Taxa de Retenção"
          value={metrics.retentionRate}
          subtitle="Últimos 6 meses"
          icon={Star}
          format="percentage"
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Frequência Média"
          value={metrics.avgDaysBetweenVisits}
          subtitle="Intervalo entre visitas"
          icon={Clock}
          format="days"
        />
        
        <StatCard
          title="Satisfação Média"
          value={metrics.satisfactionScore}
          subtitle="Avaliação dos clientes"
          icon={Star}
          format="rating"
        />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Eye className="h-3 w-3 mr-2" />
              Ver Clientes em Risco
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <MessageCircle className="h-3 w-3 mr-2" />
              Enviar Campanha
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Insights e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insights da Semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Crescimento Positivo</p>
                  <p className="text-sm text-muted-foreground">
                    {metrics.newClientsLast30Days} novos clientes este mês, um aumento de {metrics.growthRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Frequência Ideal</p>
                  <p className="text-sm text-muted-foreground">
                    Clientes retornam em média a cada {metrics.avgDaysBetweenVisits} dias
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start space-x-3">
                <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium">Alta Satisfação</p>
                  <p className="text-sm text-muted-foreground">
                    Nota média de {metrics.satisfactionScore.toFixed(1)}/5 nas avaliações
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximas Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Clientes Inativos</p>
                  <p className="text-sm text-muted-foreground">5 clientes sem agendar há 45+ dias</p>
                </div>
                <Button size="sm" variant="outline">
                  Ver Lista
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Aniversariantes</p>
                  <p className="text-sm text-muted-foreground">3 clientes fazem aniversário esta semana</p>
                </div>
                <Button size="sm" variant="outline">
                  Enviar Parabéns
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Follow-up Pendente</p>
                  <p className="text-sm text-muted-foreground">8 atendimentos precisam de follow-up</p>
                </div>
                <Button size="sm" variant="outline">
                  Revisar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMDashboard;