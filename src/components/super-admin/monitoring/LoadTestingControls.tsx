import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoadTesting } from "@/hooks/useLoadTesting";
import { useToast } from "@/hooks/use-toast";
import { 
  TestTube, 
  Zap, 
  Database, 
  Users, 
  Calendar, 
  ShoppingCart, 
  UserCheck,
  Play,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const defaultConfig = {
  barbershops: 2000,
  usersPerBarbershop: 3,
  appointmentsPerBarbershop: 50,
  salesPerBarbershop: 30,
  commandsPerBarbershop: 25,
  clientsPerBarbershop: 100,
};

export default function LoadTestingControls() {
  const { 
    isRunning, 
    currentPhase, 
    progress, 
    results, 
    error, 
    runLoadTest, 
    cleanupTestData,
    validateSystemPerformance
  } = useLoadTesting();
  
  const { toast } = useToast();
  const [config, setConfig] = useState(defaultConfig);
  const [performanceData, setPerformanceData] = useState<any>(null);

  const handleRunTest = async () => {
    try {
      await runLoadTest(config);
      toast({
        title: "Teste de Carga Concluído",
        description: `${results?.summary.totalRecords} registros criados com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro no Teste de Carga",
        description: "Ocorreu um erro durante a execução do teste.",
        variant: "destructive",
      });
    }
  };

  const handleCleanup = async () => {
    try {
      await cleanupTestData();
      toast({
        title: "Limpeza Concluída",
        description: "Todos os dados de teste foram removidos.",
      });
    } catch (error) {
      toast({
        title: "Erro na Limpeza",
        description: "Ocorreu um erro durante a limpeza dos dados.",
        variant: "destructive",
      });
    }
  };

  const handleValidatePerformance = async () => {
    try {
      const data = await validateSystemPerformance();
      setPerformanceData(data);
      toast({
        title: "Validação de Performance",
        description: "Estatísticas do sistema atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro na Validação",
        description: "Não foi possível obter as estatísticas do sistema.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const getPerformanceStatus = (value: number, threshold: number, inverse = false) => {
    const condition = inverse ? value < threshold : value > threshold;
    return condition ? 'success' : 'warning';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Testes de Carga - Fase 6</h2>
        <p className="text-muted-foreground">
          Validação final com simulação de alta carga no sistema
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Configuração do Teste
              </CardTitle>
              <CardDescription>
                Configure os parâmetros para simular carga de {config.barbershops.toLocaleString()} barbearias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barbershops">Barbearias</Label>
                  <Input
                    id="barbershops"
                    type="number"
                    value={config.barbershops}
                    onChange={(e) => setConfig({ ...config, barbershops: parseInt(e.target.value) || 0 })}
                    disabled={isRunning}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="users">Usuários por Barbearia</Label>
                  <Input
                    id="users"
                    type="number"
                    value={config.usersPerBarbershop}
                    onChange={(e) => setConfig({ ...config, usersPerBarbershop: parseInt(e.target.value) || 0 })}
                    disabled={isRunning}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clients">Clientes por Barbearia</Label>
                  <Input
                    id="clients"
                    type="number"
                    value={config.clientsPerBarbershop}
                    onChange={(e) => setConfig({ ...config, clientsPerBarbershop: parseInt(e.target.value) || 0 })}
                    disabled={isRunning}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointments">Agendamentos por Barbearia</Label>
                  <Input
                    id="appointments"
                    type="number"
                    value={config.appointmentsPerBarbershop}
                    onChange={(e) => setConfig({ ...config, appointmentsPerBarbershop: parseInt(e.target.value) || 0 })}
                    disabled={isRunning}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales">Vendas por Barbearia</Label>
                  <Input
                    id="sales"
                    type="number"
                    value={config.salesPerBarbershop}
                    onChange={(e) => setConfig({ ...config, salesPerBarbershop: parseInt(e.target.value) || 0 })}
                    disabled={isRunning}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commands">Comandas por Barbearia</Label>
                  <Input
                    id="commands"
                    type="number"
                    value={config.commandsPerBarbershop}
                    onChange={(e) => setConfig({ ...config, commandsPerBarbershop: parseInt(e.target.value) || 0 })}
                    disabled={isRunning}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Estimativa Total</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span>{config.barbershops.toLocaleString()} barbearias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>{(config.barbershops * config.usersPerBarbershop).toLocaleString()} usuários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                    <span>{(config.barbershops * config.clientsPerBarbershop).toLocaleString()} clientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span>{(config.barbershops * config.appointmentsPerBarbershop).toLocaleString()} agendamentos</span>
                  </div>
                </div>
              </div>

              {isRunning && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">{currentPhase}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={handleRunTest}
                  disabled={isRunning}
                  className="flex-1"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executando Teste...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Executar Teste de Carga
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline"
                  onClick={handleCleanup}
                  disabled={isRunning}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Dados
                </Button>

                <Button 
                  variant="secondary"
                  onClick={handleValidatePerformance}
                  disabled={isRunning}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Validar Performance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {results ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Resumo do Teste
                  </CardTitle>
                  <CardDescription>
                    Executado em {new Date(results.timestamp).toLocaleString('pt-BR')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{results.summary.totalRecords.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Registros Criados</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{formatDuration(results.summary.totalDuration)}</p>
                      <p className="text-sm text-muted-foreground">Tempo Total</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{results.summary.recordsPerSecond}</p>
                      <p className="text-sm text-muted-foreground">Registros/Segundo</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{results.summary.errorRate}%</p>
                      <p className="text-sm text-muted-foreground">Taxa de Erro</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Resultados Detalhados por Fase</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results.results.map((result, index) => (
                      <div key={index} className="border-b pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium capitalize">{result.phase}</h4>
                            <p className="text-sm text-muted-foreground">
                              {result.recordsCreated.toLocaleString()} registros criados
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge variant={result.errors > 0 ? 'destructive' : 'default'}>
                              {result.errors} erros
                            </Badge>
                            <p className="text-sm font-medium">{formatDuration(result.duration)}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Tempo médio: {result.avgResponseTime.toFixed(2)}ms</span>
                          <span>Taxa de sucesso: {((result.recordsCreated / (result.recordsCreated + result.errors)) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum resultado de teste disponível</p>
                <p className="text-sm text-muted-foreground">Execute um teste de carga para ver os resultados</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {performanceData ? (
            <div className="space-y-6">
              {/* Connection Performance */}
              {performanceData.connectionStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Performance de Conexões
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-lg font-semibold">{performanceData.connectionStats.total_connections}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-lg font-semibold text-green-600">{performanceData.connectionStats.active_connections}</p>
                        <p className="text-xs text-muted-foreground">Ativas</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-lg font-semibold">{performanceData.connectionStats.connection_usage_percent}%</p>
                        <p className="text-xs text-muted-foreground">Uso</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-lg font-semibold">{performanceData.connectionStats.max_connections}</p>
                        <p className="text-xs text-muted-foreground">Máximo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Memory Performance */}
              {performanceData.memoryStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Performance de Memória
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Buffer Hit Ratio</span>
                            <Badge variant={getPerformanceStatus(performanceData.memoryStats.buffer_hit_ratio, 95) === 'success' ? 'default' : 'destructive'}>
                              {performanceData.memoryStats.buffer_hit_ratio}%
                            </Badge>
                          </div>
                          <Progress value={performanceData.memoryStats.buffer_hit_ratio} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Index Hit Ratio</span>
                            <Badge variant={getPerformanceStatus(performanceData.memoryStats.index_hit_ratio, 95) === 'success' ? 'default' : 'destructive'}>
                              {performanceData.memoryStats.index_hit_ratio}%
                            </Badge>
                          </div>
                          <Progress value={performanceData.memoryStats.index_hit_ratio} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Archive Stats */}
              {performanceData.archiveStats && performanceData.archiveStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas de Arquivamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {performanceData.archiveStats.map((stat: any, index: number) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{stat.table_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {stat.active_records.toLocaleString()} ativos / {stat.archived_records.toLocaleString()} arquivados
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{stat.total_active_size}</p>
                            <p className="text-xs text-muted-foreground">Arquivo: {stat.total_archive_size}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum dado de performance disponível</p>
                <p className="text-sm text-muted-foreground">Clique em "Validar Performance" para obter as estatísticas</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}