import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePostgreSQLStats } from "@/hooks/usePostgreSQLStats";
import { Database, Zap, Cpu, HardDrive, Activity, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (duration: string) => {
  if (!duration) return 'N/A';
  // Parse PostgreSQL interval format
  const match = duration.match(/(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseFloat(match[3]);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds.toFixed(1)}s`;
    return `${seconds.toFixed(1)}s`;
  }
  return duration;
};

const getHitRatioBadge = (ratio: number) => {
  if (ratio >= 95) return { variant: 'default' as const, text: 'Excelente' };
  if (ratio >= 90) return { variant: 'secondary' as const, text: 'Bom' };
  if (ratio >= 80) return { variant: 'outline' as const, text: 'Aceitável' };
  return { variant: 'destructive' as const, text: 'Crítico' };
};

const getPriorityBadge = (priority: string) => {
  const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    'High': 'destructive',
    'Medium': 'outline',
    'Low': 'secondary'
  };
  return variants[priority] || 'default';
};

export default function PostgreSQLMonitoring() {
  const { 
    connectionStats, 
    memoryStats, 
    slowQueries, 
    lockStats, 
    recommendations, 
    vacuumStats,
    loading 
  } = usePostgreSQLStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Monitoramento PostgreSQL</h2>
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-24 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Monitoramento PostgreSQL</h2>
        <p className="text-muted-foreground">
          Performance, conexões e otimizações do banco de dados
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Connection Stats */}
            {connectionStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Conexões Ativas
                  </CardTitle>
                  <CardDescription>
                    Status das conexões com o banco de dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uso de Conexões</span>
                      <span>{connectionStats.connectionUsagePercent}%</span>
                    </div>
                    <Progress value={connectionStats.connectionUsagePercent} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {connectionStats.totalConnections} de {connectionStats.maxConnections} conexões
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-semibold text-green-600">{connectionStats.activeConnections}</p>
                      <p className="text-xs text-muted-foreground">Ativas</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-semibold text-blue-600">{connectionStats.idleConnections}</p>
                      <p className="text-xs text-muted-foreground">Idle</p>
                    </div>
                  </div>

                  {connectionStats.idleInTransaction > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-700">
                        {connectionStats.idleInTransaction} conexões em transação idle
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Memory Stats */}
            {memoryStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Performance de Memória
                  </CardTitle>
                  <CardDescription>
                    Cache hits e uso de memória
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Buffer Hit Ratio</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{memoryStats.bufferHitRatio}%</span>
                        <Badge variant={getHitRatioBadge(memoryStats.bufferHitRatio).variant}>
                          {getHitRatioBadge(memoryStats.bufferHitRatio).text}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={memoryStats.bufferHitRatio} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Index Hit Ratio</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{memoryStats.indexHitRatio}%</span>
                        <Badge variant={getHitRatioBadge(memoryStats.indexHitRatio).variant}>
                          {getHitRatioBadge(memoryStats.indexHitRatio).text}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={memoryStats.indexHitRatio} className="h-2" />
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Shared Buffers:</span>
                        <p className="font-medium">{memoryStats.sharedBuffersSize}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Work Mem:</span>
                        <p className="font-medium">{memoryStats.workMem}</p>
                      </div>
                    </div>
                    
                    {memoryStats.tempFilesCount > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        <HardDrive className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-700">
                          {memoryStats.tempFilesCount} arquivos temporários ({formatBytes(memoryStats.tempBytes)})
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6">
            {/* Slow Queries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Queries Mais Lentas
                </CardTitle>
                <CardDescription>
                  Top 20 queries com maior tempo médio de execução
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slowQueries.length > 0 ? (
                  <div className="space-y-4">
                    {slowQueries.slice(0, 10).map((query, index) => (
                      <div key={index} className="border-b pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <code className="text-sm bg-muted p-2 rounded flex-1 mr-4">
                            {query.queryText}
                          </code>
                          <div className="text-right space-y-1">
                            <div className="text-sm font-medium">{query.meanTime.toFixed(2)}ms</div>
                            <div className="text-xs text-muted-foreground">{query.calls} execuções</div>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Total: {query.totalTime.toFixed(2)}ms</span>
                          <span>Max: {query.maxTime.toFixed(2)}ms</span>
                          <span>Linhas: {query.rowsAffected}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Extensão pg_stat_statements não disponível</p>
                    <p className="text-sm">Estatísticas de queries não podem ser coletadas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lock Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Bloqueios Ativos
                </CardTitle>
                <CardDescription>
                  Locks em andamento no banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lockStats.length > 0 ? (
                  <div className="space-y-3">
                    {lockStats.map((lock, index) => (
                      <div key={index} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lock.relationName}</span>
                            <Badge variant={lock.granted ? 'default' : 'destructive'}>
                              {lock.granted ? 'Concedido' : 'Aguardando'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {lock.lockType} • {lock.modeLock}
                          </div>
                        </div>
                        <div className="text-right">
                          {!lock.granted && lock.waitingDuration && (
                            <div className="text-sm text-orange-600">
                              Aguardando: {formatDuration(lock.waitingDuration)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum bloqueio ativo encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Estatísticas de VACUUM e ANALYZE
              </CardTitle>
              <CardDescription>
                Status de manutenção das tabelas principais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vacuumStats.length > 0 ? (
                <div className="space-y-4">
                  {vacuumStats.slice(0, 10).map((vacuum, index) => (
                    <div key={index} className="border-b pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{vacuum.tableName}</h4>
                          <div className="text-sm text-muted-foreground">
                            {vacuum.nLiveTup.toLocaleString()} registros vivos • {vacuum.nDeadTup.toLocaleString()} registros mortos
                          </div>
                        </div>
                        <Badge variant={vacuum.deadTuplePercent > 20 ? 'destructive' : vacuum.deadTuplePercent > 10 ? 'outline' : 'default'}>
                          {vacuum.deadTuplePercent}% mortos
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Último VACUUM:</span>
                          <p>{vacuum.lastVacuum ? new Date(vacuum.lastVacuum).toLocaleDateString('pt-BR') : 'Nunca'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Último AutoVACUUM:</span>
                          <p>{vacuum.lastAutovacuum ? new Date(vacuum.lastAutovacuum).toLocaleDateString('pt-BR') : 'Nunca'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Último ANALYZE:</span>
                          <p>{vacuum.lastAnalyze ? new Date(vacuum.lastAnalyze).toLocaleDateString('pt-BR') : 'Nunca'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Execuções:</span>
                          <p>V: {vacuum.vacuumCount} • A: {vacuum.analyzeCount}</p>
                        </div>
                      </div>

                      {vacuum.deadTuplePercent > 20 && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                          <span className="text-sm text-red-700">
                            ⚠️ Alta porcentagem de registros mortos. Considere executar VACUUM FULL.
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma estatística de vacuum encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Recomendações de Otimização
              </CardTitle>
              <CardDescription>
                Sugestões para melhorar a performance do banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="border-l-4 border-l-primary pl-4 py-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{rec.recommendation}</h4>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </div>
                        <Badge variant={getPriorityBadge(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Atual:</span>
                          <span className="ml-1 font-medium">{rec.currentValue}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Recomendado:</span>
                          <span className="ml-1 font-medium text-green-600">{rec.recommendedValue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma recomendação disponível no momento</p>
                  <p className="text-sm">O sistema está funcionando dentro dos parâmetros ideais</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}