import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  Users,
  DollarSign,
  MessageCircle,
  Star,
  Clock,
  Target,
  Filter
} from "lucide-react";

const ReportsManager = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  // Mock data para demonstração
  const reports = [
    {
      id: 1,
      name: "Relatório de Retenção",
      description: "Análise detalhada da retenção de clientes",
      type: "retention",
      period: "Últimos 6 meses",
      status: "ready",
      generatedAt: "2024-01-20",
      insights: [
        "Taxa de retenção de 78% (acima da média)",
        "Clientes VIP têm 95% de retenção",
        "Maior churn entre clientes sazonais"
      ]
    },
    {
      id: 2,
      name: "Performance de Campanhas",
      description: "Resultados das campanhas de marketing",
      type: "campaigns",
      period: "Últimos 3 meses",
      status: "ready",
      generatedAt: "2024-01-18",
      insights: [
        "Taxa de abertura média: 85%",
        "Campanhas de reativação: 32% de sucesso",
        "WhatsApp é o canal mais efetivo"
      ]
    },
    {
      id: 3,
      name: "Análise de CLV",
      description: "Customer Lifetime Value por segmento",
      type: "clv",
      period: "Todo o período",
      status: "generating",
      generatedAt: null,
      insights: []
    },
    {
      id: 4,
      name: "Satisfação do Cliente",
      description: "Análise de feedbacks e avaliações",
      type: "satisfaction",
      period: "Últimos 2 meses",
      status: "ready",
      generatedAt: "2024-01-15",
      insights: [
        "Nota média: 4.6/5",
        "92% dos clientes recomendam",
        "Tempo de espera é o principal ponto de melhoria"
      ]
    }
  ];

  const kpis = [
    {
      title: "Taxa de Retenção",
      value: "78%",
      change: "+5%",
      trend: "up",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "CLV Médio",
      value: "R$ 1.245",
      change: "+12%",
      trend: "up",
      icon: DollarSign,
      color: "text-blue-600"
    },
    {
      title: "Taxa de Resposta",
      value: "67%",
      change: "-3%",
      trend: "down",
      icon: MessageCircle,
      color: "text-purple-600"
    },
    {
      title: "NPS Score",
      value: "8.4",
      change: "+0.8",
      trend: "up",
      icon: Star,
      color: "text-yellow-600"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800";
      case "generating":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready":
        return "Pronto";
      case "generating":
        return "Gerando...";
      case "scheduled":
        return "Agendado";
      default:
        return "Rascunho";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "retention":
        return <Users className="h-4 w-4" />;
      case "campaigns":
        return <MessageCircle className="h-4 w-4" />;
      case "clv":
        return <DollarSign className="h-4 w-4" />;
      case "satisfaction":
        return <Star className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "retention":
        return "Retenção";
      case "campaigns":
        return "Campanhas";
      case "clv":
        return "CLV";
      case "satisfaction":
        return "Satisfação";
      default:
        return "Relatório";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios e Analytics</h2>
          <p className="text-muted-foreground">
            Insights detalhados sobre performance e comportamento dos clientes
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <BarChart3 className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{kpi.value}</span>
                      <Badge 
                        variant={kpi.trend === "up" ? "default" : "secondary"}
                        className={kpi.trend === "up" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {kpi.trend === "up" ? "↗" : "↘"} {kpi.change}
                      </Badge>
                    </div>
                  </div>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seletor de Período */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Período de Análise</h3>
              <p className="text-sm text-muted-foreground">Selecione o período para os relatórios</p>
            </div>
            <div className="flex space-x-2">
              {["7d", "30d", "90d", "1y"].map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period === "7d" ? "7 dias" :
                   period === "30d" ? "30 dias" :
                   period === "90d" ? "3 meses" : "1 ano"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Relatórios */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Relatórios Disponíveis</h3>
        
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Ícone */}
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-800">
                    {getTypeIcon(report.type)}
                  </div>
                  
                  {/* Informações */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold">{report.name}</h4>
                      <Badge variant="outline">
                        {getTypeName(report.type)}
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>
                        {getStatusText(report.status)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {report.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Período:</span>
                        <p className="text-muted-foreground">{report.period}</p>
                      </div>
                      {report.generatedAt && (
                        <div>
                          <span className="font-medium">Gerado em:</span>
                          <p className="text-muted-foreground">
                            {new Date(report.generatedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Insights */}
                    {report.insights.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Principais Insights:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {report.insights.map((insight, index) => (
                            <li key={index}>• {insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Ações */}
                <div className="flex items-center space-x-2">
                  {report.status === "ready" && (
                    <>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Visualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                  {report.status === "generating" && (
                    <Button variant="outline" size="sm" disabled>
                      <Clock className="h-3 w-3 mr-1 animate-spin" />
                      Gerando...
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Templates de Relatório */}
      <Card>
        <CardHeader>
          <CardTitle>Templates de Relatório</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gere relatórios personalizados usando templates pré-configurados
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <TrendingUp className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Performance</div>
                <div className="text-xs text-muted-foreground">Métricas gerais</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Segmentação</div>
                <div className="text-xs text-muted-foreground">Análise de segmentos</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <MessageCircle className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Comunicação</div>
                <div className="text-xs text-muted-foreground">Efetividade das campanhas</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Target className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">ROI</div>
                <div className="text-xs text-muted-foreground">Retorno do investimento</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsManager;