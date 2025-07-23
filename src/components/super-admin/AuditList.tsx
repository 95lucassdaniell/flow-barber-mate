import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Activity,
  Clock,
  User,
  Eye,
  Filter,
  Calendar,
  Shield,
  Building2,
  Users,
  Settings as SettingsIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: any;
  created_at: string;
  super_admin?: {
    full_name: string;
    email: string;
  };
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  mostActiveUser: string;
}

const actionTypeMap: Record<string, { label: string; color: string; icon: any }> = {
  'create_barbershop': { label: 'Barbearia Criada', color: 'bg-green-500', icon: Building2 },
  'update_barbershop': { label: 'Barbearia Atualizada', color: 'bg-blue-500', icon: Building2 },
  'delete_barbershop': { label: 'Barbearia Removida', color: 'bg-red-500', icon: Building2 },
  'activate_user': { label: 'Usuário Ativado', color: 'bg-green-500', icon: Users },
  'deactivate_user': { label: 'Usuário Desativado', color: 'bg-orange-500', icon: Users },
  'create_user': { label: 'Usuário Criado', color: 'bg-green-500', icon: Users },
  'update_user': { label: 'Usuário Atualizado', color: 'bg-blue-500', icon: Users },
  'login': { label: 'Login Sistema', color: 'bg-gray-500', icon: Shield },
  'system_config': { label: 'Configuração Sistema', color: 'bg-purple-500', icon: SettingsIcon },
};

export default function AuditList() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    todayLogs: 0,
    weekLogs: 0,
    mostActiveUser: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
    calculateStats();
  }, [searchTerm, actionFilter, targetTypeFilter, dateFilter, auditLogs]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          super_admin:super_admins!super_admin_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar logs de auditoria",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = auditLogs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.super_admin?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.super_admin?.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (targetTypeFilter !== "all") {
      filtered = filtered.filter(log => log.target_type === targetTypeFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      if (dateFilter !== "all") {
        filtered = filtered.filter(log => new Date(log.created_at) >= filterDate);
      }
    }

    setFilteredLogs(filtered);
  };

  const calculateStats = () => {
    const totalLogs = auditLogs.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = auditLogs.filter(log => new Date(log.created_at) >= today).length;
    
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    const weekLogs = auditLogs.filter(log => new Date(log.created_at) >= weekAgo).length;
    
    // Most active user
    const userActions = auditLogs.reduce((acc, log) => {
      const userName = log.super_admin?.full_name || 'Sistema';
      acc[userName] = (acc[userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveUser = Object.entries(userActions)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    setStats({
      totalLogs,
      todayLogs,
      weekLogs,
      mostActiveUser,
    });
  };

  const getActionBadge = (action: string) => {
    const actionInfo = actionTypeMap[action] || { 
      label: action, 
      color: 'bg-gray-500', 
      icon: Activity 
    };
    
    const IconComponent = actionInfo.icon;
    
    return (
      <Badge className="gap-1" style={{ backgroundColor: actionInfo.color }}>
        <IconComponent className="h-3 w-3" />
        {actionInfo.label}
      </Badge>
    );
  };

  const getTargetTypeBadge = (targetType: string) => {
    const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      barbershop: { label: "Barbearia", variant: "default" },
      user: { label: "Usuário", variant: "secondary" },
      system: { label: "Sistema", variant: "outline" },
      profile: { label: "Perfil", variant: "secondary" },
    };
    
    const typeInfo = typeMap[targetType] || { label: targetType, variant: "outline" };
    return <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>;
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR');
  };

  const showLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsModalOpen(true);
  };

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
  const uniqueTargetTypes = [...new Set(auditLogs.map(log => log.target_type))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Auditoria do Sistema</h1>
          <p className="text-muted-foreground">Histórico de ações e atividades do sistema</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
            <p className="text-xs text-muted-foreground">registros totais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayLogs}</div>
            <p className="text-xs text-muted-foreground">ações hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekLogs}</div>
            <p className="text-xs text-muted-foreground">ações na semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Ativo</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.mostActiveUser}</div>
            <p className="text-xs text-muted-foreground">usuário mais ativo</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ação, tipo ou usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {actionTypeMap[action]?.label || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Alvo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueTargetTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo Período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ação</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum log de auditoria encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getTargetTypeBadge(log.target_type)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {log.super_admin?.full_name || 'Sistema'}
                        </div>
                        {log.super_admin?.email && (
                          <div className="text-sm text-muted-foreground">
                            {log.super_admin.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatDateTime(log.created_at).split(' ')[0]}</div>
                        <div className="text-sm text-muted-foreground">{formatTime(log.created_at)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showLogDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">INFORMAÇÕES DA AÇÃO</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Ação</label>
                      <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tipo de Alvo</label>
                      <div className="mt-1">{getTargetTypeBadge(selectedLog.target_type)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">ID do Alvo</label>
                      <p className="text-sm text-muted-foreground font-mono">
                        {selectedLog.target_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">INFORMAÇÕES DO USUÁRIO</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Nome</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedLog.super_admin?.full_name || 'Sistema'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedLog.super_admin?.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Data/Hora</label>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(selectedLog.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedLog.details && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">DETALHES ADICIONAIS</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">IDENTIFICADORES</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="text-sm font-medium">ID do Log</label>
                    <p className="text-sm text-muted-foreground font-mono">{selectedLog.id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}