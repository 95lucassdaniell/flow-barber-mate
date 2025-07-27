import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useArchiveStats } from "@/hooks/useArchiveStats";
import { useSystemStats } from "@/hooks/useSystemStats";
import { Archive, Trash2, RefreshCcw, Database, Settings, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MaintenanceControls() {
  const { runArchiveOperation, runCleanupOperation, refetch: refetchArchive } = useArchiveStats();
  const { refetch: refetchSystem } = useSystemStats();
  const { toast } = useToast();

  const [isArchiving, setIsArchiving] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retentionMonths, setRetentionMonths] = useState(12);
  const [cleanupYears, setCleanupYears] = useState(5);

  const handleArchiveOperation = async () => {
    setIsArchiving(true);
    try {
      const results = await runArchiveOperation(retentionMonths);
      
      const totalArchived = results.reduce((sum, result) => sum + result.recordsArchived, 0);
      const totalPartitionsDropped = results.reduce((sum, result) => sum + result.partitionsDropped, 0);

      toast({
        title: "Arquivamento Concluído",
        description: `${totalArchived} registros arquivados e ${totalPartitionsDropped} partições removidas.`,
      });
      
      // Refresh all stats
      await Promise.all([refetchArchive(), refetchSystem()]);
      
    } catch (error) {
      toast({
        title: "Erro no Arquivamento",
        description: "Ocorreu um erro durante o processo de arquivamento.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleCleanupOperation = async () => {
    setIsCleaning(true);
    try {
      const deletedRecords = await runCleanupOperation(cleanupYears);
      
      toast({
        title: "Limpeza Concluída",
        description: `${deletedRecords} registros antigos foram removidos permanentemente.`,
      });
      
      // Refresh all stats
      await Promise.all([refetchArchive(), refetchSystem()]);
      
    } catch (error) {
      toast({
        title: "Erro na Limpeza",
        description: "Ocorreu um erro durante o processo de limpeza.",
        variant: "destructive",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const handleRefreshStats = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchArchive(), refetchSystem()]);
      
      toast({
        title: "Estatísticas Atualizadas",
        description: "Todas as estatísticas foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na Atualização",
        description: "Ocorreu um erro ao atualizar as estatísticas.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Controles de Manutenção</h2>
        <p className="text-muted-foreground">
          Execute operações de manutenção e otimização do sistema
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Atenção:</strong> As operações de manutenção podem afetar a performance do sistema temporariamente. 
          Execute durante períodos de menor atividade.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Operação de Arquivamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Arquivamento de Dados
            </CardTitle>
            <CardDescription>
              Move dados antigos para tabelas de arquivo para otimizar performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="retention">Retenção (meses)</Label>
              <Input
                id="retention"
                type="number"
                value={retentionMonths}
                onChange={(e) => setRetentionMonths(parseInt(e.target.value) || 12)}
                min="1"
                max="36"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Dados mais antigos que este período serão arquivados
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="w-fit">
                Tabelas afetadas: appointments, sales, commands
              </Badge>
            </div>

            <Button 
              onClick={handleArchiveOperation}
              disabled={isArchiving}
              className="w-full"
            >
              {isArchiving ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Arquivando...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Executar Arquivamento
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Operação de Limpeza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Limpeza de Dados Antigos
            </CardTitle>
            <CardDescription>
              Remove permanentemente dados arquivados muito antigos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cleanup">Manter (anos)</Label>
              <Input
                id="cleanup"
                type="number"
                value={cleanupYears}
                onChange={(e) => setCleanupYears(parseInt(e.target.value) || 5)}
                min="1"
                max="10"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Dados arquivados mais antigos que este período serão removidos
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="destructive" className="w-fit">
                ⚠️ Operação irreversível
              </Badge>
            </div>

            <Button 
              onClick={handleCleanupOperation}
              disabled={isCleaning}
              variant="destructive"
              className="w-full"
            >
              {isCleaning ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Limpando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Executar Limpeza
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Controles Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Controles do Sistema
          </CardTitle>
          <CardDescription>
            Operações gerais de manutenção e monitoramento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleRefreshStats}
              disabled={isRefreshing}
              variant="outline"
            >
              {isRefreshing ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Atualizar Estatísticas
                </>
              )}
            </Button>

            <Button 
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard/project/yzqwmxffjufefocgkevz/sql/new', '_blank')}
            >
              <Database className="h-4 w-4 mr-2" />
              Abrir SQL Editor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}