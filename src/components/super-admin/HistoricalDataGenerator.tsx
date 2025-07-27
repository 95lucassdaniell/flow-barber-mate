import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Database, 
  Play, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Users,
  Calendar,
  ShoppingCart,
  Receipt
} from "lucide-react";
import { useHistoricalDataGenerator } from "@/hooks/useHistoricalDataGenerator";
import { useToast } from "@/hooks/use-toast";

// Barbershop ID for BarberiaVargas
const BARBERSHOP_ID = "9ccfd4a2-3bc1-41be-933b-51e94d0dc29a";

export default function HistoricalDataGenerator() {
  const {
    isRunning,
    currentPhase,
    progress,
    results,
    error,
    generateHistoricalData,
    cleanupHistoricalData,
    validateDataIntegrity,
    getDefaultConfig,
  } = useHistoricalDataGenerator();

  const { toast } = useToast();
  
  const [config, setConfig] = useState(getDefaultConfig(BARBERSHOP_ID));
  const [dataStats, setDataStats] = useState<{
    clientsCount: number;
    appointmentsCount: number;
    salesCount: number;
    commandsCount: number;
  } | null>(null);

  useEffect(() => {
    loadDataStats();
  }, []);

  const loadDataStats = async () => {
    try {
      const stats = await validateDataIntegrity(BARBERSHOP_ID);
      setDataStats(stats);
    } catch (error) {
      console.error('Error loading data stats:', error);
    }
  };

  const handleGenerate = async () => {
    try {
      await generateHistoricalData(config);
      await loadDataStats();
      toast({
        title: "Sucesso!",
        description: "Dados históricos gerados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar dados históricos",
        variant: "destructive",
      });
    }
  };

  const handleCleanup = async () => {
    if (!confirm("Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await cleanupHistoricalData(BARBERSHOP_ID);
      await loadDataStats();
      toast({
        title: "Sucesso!",
        description: "Dados limpos com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao limpar dados",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerador de Dados Históricos</h1>
          <p className="text-muted-foreground">
            Gerar dados realistas para teste da IA Preditiva - Barbearia Vargas
          </p>
        </div>
      </div>

      {/* Current Data Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dados Atuais da Barbearia
          </CardTitle>
          <CardDescription>
            Estatísticas dos dados existentes na Barbearia Vargas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dataStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Clientes</span>
                </div>
                <div className="text-2xl font-bold">{dataStats.clientsCount}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Agendamentos</span>
                </div>
                <div className="text-2xl font-bold">{dataStats.appointmentsCount}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Comandas</span>
                </div>
                <div className="text-2xl font-bold">{dataStats.commandsCount}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Vendas</span>
                </div>
                <div className="text-2xl font-bold">{dataStats.salesCount}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Carregando estatísticas...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração da Geração</CardTitle>
          <CardDescription>
            Configure os parâmetros para geração de dados históricos realistas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientsToCreate">Clientes a Criar</Label>
              <Input
                id="clientsToCreate"
                type="number"
                value={config.clientsToCreate}
                onChange={(e) => setConfig({...config, clientsToCreate: parseInt(e.target.value)})}
                min={1}
                max={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total final: {(dataStats?.clientsCount || 0) + config.clientsToCreate} clientes
              </p>
            </div>
            
            <div>
              <Label htmlFor="appointmentsToCreate">Agendamentos a Criar</Label>
              <Input
                id="appointmentsToCreate"
                type="number"
                value={config.appointmentsToCreate}
                onChange={(e) => setConfig({...config, appointmentsToCreate: parseInt(e.target.value)})}
                min={100}
                max={5000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                85% históricos, 15% futuros
              </p>
            </div>
            
            <div>
              <Label htmlFor="startDate">Data Inicial (6 meses atrás)</Label>
              <Input
                id="startDate"
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({...config, startDate: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Data Final (1 mês à frente)</Label>
              <Input
                id="endDate"
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig({...config, endDate: e.target.value})}
              />
            </div>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button 
              onClick={handleGenerate} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Gerando...' : 'Gerar Dados Históricos'}
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleCleanup} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Progresso da Geração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{currentPhase}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resultado da Geração
            </CardTitle>
            <CardDescription>
              Relatório detalhado da geração de dados concluída
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {results.summary.totalRecords}
                </div>
                <div className="text-sm text-muted-foreground">Registros Criados</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatDuration(results.summary.totalDuration)}
                </div>
                <div className="text-sm text-muted-foreground">Tempo Total</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {results.summary.recordsPerSecond}
                </div>
                <div className="text-sm text-muted-foreground">Registros/seg</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {results.summary.errorRate}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa de Erro</div>
              </div>
            </div>

            {/* Phase Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Detalhes por Fase</h3>
              <div className="space-y-3">
                {results.results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{result.phase}</Badge>
                      <span className="font-medium">
                        {result.recordsCreated} registros criados
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatDuration(result.duration)}</span>
                      <span>{result.errors} erros</span>
                      <span>{Math.round(result.avgResponseTime)}ms média</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Benefits */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">
                Benefícios para Teste da IA
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>6 meses de dados históricos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Padrões realistas de comportamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Diferentes perfis de cliente</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Vendas com produtos inclusos</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}