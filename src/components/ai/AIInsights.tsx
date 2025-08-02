import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/ui/stat-card';
import { useAIAnalytics } from '@/hooks/useAIAnalytics';
import { useCRMMetrics } from '@/hooks/useCRMMetrics';
import { AutomationsManager } from './AutomationsManager';
import { SalesAnalyticsDashboard } from './SalesAnalyticsDashboard';
import { ClientInsights } from './ClientInsights';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar,
  Target,
  Lightbulb,
  RefreshCw,
  Zap,
  UserPlus,
  Heart,
  Repeat,
  Star
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AIInsights: React.FC = () => {
  console.log('🚀 [AI INSIGHTS DEFINITIVO] Componente carregado - Sistema 100% local sem edge functions');
  
  const { insights, loading, error, refreshInsights, clientPatterns, scheduleInsights } = useAIAnalytics();
  const { metrics: crmMetrics, loading: crmLoading } = useCRMMetrics();
  const [clientsMap, setClientsMap] = useState<Map<string, string>>(new Map());

  // Buscar nomes dos clientes
  useEffect(() => {
    const fetchClientNames = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name');
        
        if (!error && data) {
          const newClientsMap = new Map();
          data.forEach(client => {
            newClientsMap.set(client.id, client.name);
          });
          setClientsMap(newClientsMap);
        }
      } catch (err) {
        console.error('Erro ao buscar nomes dos clientes:', err);
      }
    };

    fetchClientNames();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">IA Preditiva</h2>
          <RefreshCw className="h-4 w-4 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar insights de IA: {error}
          <Button variant="outline" size="sm" onClick={refreshInsights} className="ml-2">
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!insights) {
    return (
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          Dados insuficientes para gerar insights de IA. Execute algumas vendas e agendamentos primeiro.
        </AlertDescription>
      </Alert>
    );
  }

  const getChurnRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'default';
    }
  };

  const getClientName = (clientId: string) => {
    return clientsMap.get(clientId) || `Cliente ${clientId.slice(0, 8)}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">IA Preditiva</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            console.log('🚀 Forçando atualização da IA Preditiva');
            console.log('📊 Estado atual:', { insights, clientPatterns, loading });
            refreshInsights();
          }}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Carregando...' : 'Atualizar Insights'}
        </Button>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="sales">
            <TrendingUp className="h-4 w-4 mr-2" />
            Análise de Vendas
          </TabsTrigger>
          <TabsTrigger value="automations">
            <Zap className="h-4 w-4 mr-2" />
            Automações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          {/* Métricas CRM */}
          {crmMetrics && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Métricas CRM</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  title="Total de Clientes"
                  value={crmMetrics.totalClients}
                  subtitle="Clientes cadastrados"
                  icon={Users}
                  format="number"
                />
                <StatCard
                  title="Novos Clientes (30d)"
                  value={crmMetrics.newClients30d.count}
                  subtitle="Crescimento mensal"
                  trend={crmMetrics.newClients30d.growthRate}
                  icon={UserPlus}
                  format="number"
                />
                <StatCard
                  title="CLV Médio"
                  value={crmMetrics.avgCLV}
                  subtitle="Valor médio por cliente"
                  icon={DollarSign}
                  format="currency"
                />
                <StatCard
                  title="Taxa de Retenção"
                  value={crmMetrics.retentionRate}
                  subtitle="Clientes que retornam"
                  icon={Heart}
                  format="percentage"
                />
                <StatCard
                  title="Frequência Média"
                  value={crmMetrics.avgFrequencyDays}
                  subtitle="Intervalo entre visitas"
                  icon={Repeat}
                  format="days"
                />
                <StatCard
                  title="NPS Score"
                  value={crmMetrics.npsScore}
                  subtitle="Satisfação estimada"
                  icon={Star}
                  format="rating"
                />
              </div>
            </div>
          )}

          {/* Métricas IA */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Insights de IA</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Prevista</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(insights.predictedMonthlyRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes em Risco</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {insights.churnRiskClients.length}
                </div>
                <p className="text-xs text-muted-foreground">Precisam de atenção</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ações Recomendadas</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insights.recommendedActions.length}
                </div>
                <p className="text-xs text-muted-foreground">Oportunidades identificadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Potencial de Impacto</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(insights.predictedMonthlyRevenue * 0.1)}
                </div>
                <p className="text-xs text-muted-foreground">Receita adicional possível</p>
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Recomendações de Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recomendações Inteligentes
              </CardTitle>
              <CardDescription>
                Ações prioritárias baseadas na análise de IA dos seus dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.recommendedActions.map((action, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge variant="default">Recomendação</Badge>
                      </div>
                    </div>
                    <h4 className="font-medium mb-1">{action}</h4>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Padrões de Clientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Clientes em Risco de Abandono
                </CardTitle>
                <CardDescription>
                  Clientes que passaram do ciclo normal de visitas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientPatterns
                    .filter(pattern => pattern.churnRisk !== 'low')
                    .slice(0, 5)
                    .map((pattern) => (
                      <div key={pattern.clientId} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{getClientName(pattern.clientId)}</div>
                          <div className="text-sm text-muted-foreground">
                            Última visita: {format(new Date(pattern.lastVisit), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Ciclo: {pattern.averageCycle} dias
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={getChurnRiskColor(pattern.churnRisk)}>
                            {pattern.churnRisk === 'high' ? 'Alto Risco' : 'Risco Médio'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            LTV: {formatCurrency(pattern.lifetimeValue)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximos Agendamentos Previstos
                </CardTitle>
                <CardDescription>
                  Clientes que devem agendar em breve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientPatterns
                    .filter(pattern => {
                      const daysDiff = Math.abs(
                        new Date(pattern.nextPredictedVisit).getTime() - new Date().getTime()
                      ) / (1000 * 60 * 60 * 24);
                      return daysDiff <= 7 && pattern.churnRisk === 'low';
                    })
                    .slice(0, 5)
                    .map((pattern) => (
                      <div key={pattern.clientId} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{getClientName(pattern.clientId)}</div>
                          <div className="text-sm text-muted-foreground">
                            Previsão: {format(new Date(pattern.nextPredictedVisit), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="default">Oportunidade</Badge>
                          <div className="text-xs text-muted-foreground">
                            {pattern.totalVisits} visitas
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights de Horários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Otimização de Horários
              </CardTitle>
              <CardDescription>
                Horários com baixa ocupação que podem ser otimizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduleInsights
                  .filter(insight => insight.occupationRate < 0.5)
                  .slice(0, 6)
                  .map((insight, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">
                          {insight.dayOfWeek} - {insight.timeSlot}
                        </div>
                        <Badge variant="secondary">
                          {Math.round(insight.occupationRate * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.suggestedAction}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        Receita média: {formatCurrency(insight.potentialRevenue)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <ClientInsights />
        </TabsContent>

        <TabsContent value="sales">
          <SalesAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="automations">
          <AutomationsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};