import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSystemStats } from "@/hooks/useSystemStats";
import { Building2, Users, Calendar, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const StatCard = ({ title, value, icon: Icon, description, badge }: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  badge?: { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' };
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {badge && (
        <Badge variant={badge.variant} className="mt-2">
          {badge.text}
        </Badge>
      )}
    </CardContent>
  </Card>
);

export default function SystemOverview() {
  const { stats, tableStats, loading } = useSystemStats();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Visão Geral do Sistema</h2>
        <p className="text-muted-foreground">Principais métricas em tempo real</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Barbearias"
          value={stats.totalBarbershops}
          icon={Building2}
          description="Todas as contas cadastradas"
        />
        
        <StatCard
          title="Usuários Ativos"
          value={stats.totalUsers}
          icon={Users}
          description="Usuários em todas as barbearias"
        />
        
        <StatCard
          title="Agendamentos Hoje"
          value={stats.todayAppointments}
          icon={Calendar}
          description="Agendamentos para hoje"
          badge={{ text: "Tempo real", variant: "default" }}
        />
        
        <StatCard
          title="Receita Mensal"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          description="Receita total do mês"
          badge={{ text: "Atualizado", variant: "default" }}
        />
        
        <StatCard
          title="Contas Ativas"
          value={stats.activeBarbershops}
          icon={CheckCircle}
          description="Barbearias com pagamento em dia"
          badge={{ text: "Ativo", variant: "default" }}
        />
        
        <StatCard
          title="Contas Trial"
          value={stats.trialBarbershops}
          icon={Clock}
          description="Barbearias em período trial"
          badge={{ text: "Trial", variant: "secondary" }}
        />
        
        <StatCard
          title="Contas Inadimplentes"
          value={stats.overdueAccounts}
          icon={AlertTriangle}
          description="Barbearias com pagamento em atraso"
          badge={{ text: "Atenção", variant: "destructive" }}
        />
        
        <StatCard
          title="Total de Agendamentos"
          value={stats.totalAppointments.toLocaleString()}
          icon={TrendingUp}
          description="Agendamentos realizados"
        />
      </div>

      {tableStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas das Tabelas</CardTitle>
            <CardDescription>
              Tamanho e performance das principais tabelas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tableStats.map((table) => (
                <div key={table.tableName} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{table.tableName}</p>
                    <p className="text-sm text-muted-foreground">
                      {table.rowCount.toLocaleString()} registros
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{table.tableSize}</p>
                    <p className="text-xs text-muted-foreground">
                      Índices: {table.indexSize}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}