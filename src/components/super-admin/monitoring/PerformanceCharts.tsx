import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBarbershopPerformance } from "@/hooks/useBarbershopPerformance";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Users, Calendar } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function PerformanceCharts() {
  const { barbershops, loading } = useBarbershopPerformance();

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted animate-pulse rounded"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted animate-pulse rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Top 10 barbearias por receita mensal
  const topBarbershopsByRevenue = barbershops
    .filter(b => b.monthlyRevenue > 0)
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 10)
    .map(b => ({
      name: b.name.length > 15 ? b.name.substring(0, 15) + '...' : b.name,
      receita: b.monthlyRevenue,
      fullName: b.name
    }));

  // Distribuição por status de conta
  const statusDistribution = barbershops.reduce((acc, barbershop) => {
    const status = barbershop.status;
    const existing = acc.find(item => item.name === status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: status, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Top barbearias por atividade hoje
  const topActivityToday = barbershops
    .filter(b => b.appointmentsToday > 0 || b.salesToday > 0)
    .sort((a, b) => (b.appointmentsToday + b.salesToday) - (a.appointmentsToday + a.salesToday))
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'active': 'default',
      'trial': 'secondary',
      'overdue': 'destructive',
      'cancelled': 'outline'
    };
    
    const labels: { [key: string]: string } = {
      'active': 'Ativo',
      'trial': 'Trial',
      'overdue': 'Inadimplente',
      'cancelled': 'Cancelado'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Performance das Barbearias</h2>
        <p className="text-muted-foreground">
          Análise detalhada da performance e atividade das barbearias
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Barbearias por Receita */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 10 - Receita Mensal
            </CardTitle>
            <CardDescription>
              Barbearias com maior receita mensal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topBarbershopsByRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    formatCurrency(value), 
                    'Receita'
                  ]}
                  labelFormatter={(label: string, payload: any[]) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName || label;
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Distribuição por Status
            </CardTitle>
            <CardDescription>
              Status das contas das barbearias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Atividade Hoje */}
      {topActivityToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Maior Atividade Hoje
            </CardTitle>
            <CardDescription>
              Barbearias com mais agendamentos e vendas hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topActivityToday.map((barbershop) => (
                <div key={barbershop.id} className="flex items-center justify-between border-b pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{barbershop.name}</p>
                      {getStatusBadge(barbershop.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {barbershop.totalUsers} usuários
                      </span>
                      <span>Plano: {barbershop.plan}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">{barbershop.appointmentsToday}</p>
                        <p className="text-xs text-muted-foreground">Agendamentos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{formatCurrency(barbershop.salesToday)}</p>
                        <p className="text-xs text-muted-foreground">Vendas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{barbershop.commandsOpen}</p>
                        <p className="text-xs text-muted-foreground">Comandas</p>
                      </div>
                    </div>
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