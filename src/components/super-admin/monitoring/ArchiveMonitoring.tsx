import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useArchiveStats } from "@/hooks/useArchiveStats";
import { Database, Archive, HardDrive, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function ArchiveMonitoring() {
  const { archiveStats, loading } = useArchiveStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitoramento de Arquivo</CardTitle>
          <CardDescription>Carregando estatísticas de arquivamento...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                <div className="h-2 w-full bg-muted animate-pulse rounded"></div>
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTotalSize = (sizeStr: string): number => {
    if (!sizeStr) return 0;
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    
    const multipliers: { [key: string]: number } = {
      'bytes': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024,
    };
    
    return value * (multipliers[unit] || 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Monitoramento de Arquivo</h2>
        <p className="text-muted-foreground">
          Acompanhe o status do arquivamento e otimização de dados
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {archiveStats.map((stat) => {
          const totalRecords = stat.activeRecords + stat.archivedRecords;
          const archivePercentage = totalRecords > 0 ? (stat.archivedRecords / totalRecords) * 100 : 0;
          const activeSize = getTotalSize(stat.totalActiveSize);
          const archiveSize = getTotalSize(stat.totalArchiveSize);
          const totalSize = activeSize + archiveSize;
          const spaceSavedPercentage = totalSize > 0 ? (archiveSize / totalSize) * 100 : 0;

          return (
            <Card key={stat.tableName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {stat.tableName}
                  </CardTitle>
                  <Badge variant="outline">
                    {archivePercentage.toFixed(1)}% arquivado
                  </Badge>
                </div>
                <CardDescription>
                  Estatísticas de arquivamento para a tabela {stat.tableName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Distribuição de Registros */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Distribuição de Registros</span>
                    <span className="text-sm text-muted-foreground">
                      {totalRecords.toLocaleString()} total
                    </span>
                  </div>
                  <Progress value={archivePercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      Ativos: {stat.activeRecords.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Archive className="h-3 w-3" />
                      Arquivados: {stat.archivedRecords.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Uso de Espaço */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uso de Espaço</span>
                    <span className="text-sm text-muted-foreground">
                      {spaceSavedPercentage.toFixed(1)}% otimizado
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <HardDrive className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Tabela Ativa</p>
                      <p className="text-sm font-medium">{stat.totalActiveSize}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Archive className="h-4 w-4 mx-auto mb-1 text-secondary" />
                      <p className="text-xs text-muted-foreground">Arquivo</p>
                      <p className="text-sm font-medium">{stat.totalArchiveSize}</p>
                    </div>
                  </div>
                </div>

                {/* Data do Arquivo Mais Antigo */}
                {stat.oldestArchiveDate && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Arquivo mais antigo:
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(stat.oldestArchiveDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}