import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProviderAuth } from '@/hooks/useProviderAuth';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useProviderGoals } from '@/hooks/useProviderGoals';
import { Calendar, DollarSign, Target, TrendingUp, CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const ProviderDashboard = () => {
  const { profile } = useProviderAuth();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  
  const startDate = format(dateRange.from, 'yyyy-MM-dd');
  const endDate = format(dateRange.to, 'yyyy-MM-dd');
  
  const { stats, commissions, loading: financialLoading } = useFinancialData(startDate, endDate, profile?.id);
  const { goals, loading: goalsLoading } = useProviderGoals(profile?.id);

  // Filtrar metas ativas no período atual
  const currentGoals = goals.filter(goal => {
    const now = new Date();
    const periodStart = new Date(goal.period_start);
    const periodEnd = new Date(goal.period_end);
    return now >= periodStart && now <= periodEnd && goal.is_active;
  });

  const getGoalProgress = (goal: any) => {
    return goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
  };

  const getGoalTypeLabel = (goalType: string) => {
    const labels = {
      'service_quantity': 'Qtd. Serviços',
      'service_value': 'Valor Serviços',
      'product_quantity': 'Qtd. Produtos',
      'product_value': 'Valor Produtos',
      'specific_service': 'Serviço Específico',
      'specific_product': 'Produto Específico'
    };
    return labels[goalType as keyof typeof labels] || goalType;
  };

  if (financialLoading || goalsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Bem-vindo, {profile?.full_name}
          </h1>
          <p className="text-muted-foreground">
            Acompanhe sua performance de {format(dateRange.from, 'dd/MM/yyyy')} a {format(dateRange.to, 'dd/MM/yyyy')}
          </p>
        </div>
        
        {/* Filtro de Data */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Selecionar período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from) {
                    setDateRange({
                      from: range.from,
                      to: range.to || range.from
                    });
                  }
                }}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          <Button
            variant="outline"
            onClick={() => {
              const now = new Date();
              setDateRange({
                from: startOfMonth(now),
                to: endOfMonth(now)
              });
            }}
          >
            Este mês
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats?.totalCommissions?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats?.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total gerado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats?.averageTicket?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Por atendimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentGoals.length}</div>
            <p className="text-xs text-muted-foreground">
              Metas em andamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metas Atuais */}
      {currentGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Suas Metas Atuais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentGoals.map((goal) => {
              const progress = getGoalProgress(goal);
              const isCompleted = progress >= 100;
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{getGoalTypeLabel(goal.goal_type)}</h4>
                      {goal.specific_service?.name && (
                        <p className="text-sm text-muted-foreground">
                          Serviço: {goal.specific_service.name}
                        </p>
                      )}
                      {goal.specific_product?.name && (
                        <p className="text-sm text-muted-foreground">
                          Produto: {goal.specific_product.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {goal.current_value.toLocaleString('pt-BR')} / {goal.target_value.toLocaleString('pt-BR')}
                      </p>
                      <p className={`text-sm ${isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {progress.toFixed(1)}% concluído
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(progress, 100)} 
                    className="h-2"
                  />
                  {isCompleted && (
                    <p className="text-sm text-green-600 font-medium">
                      🎉 Meta atingida! Parabéns!
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Últimas Comissões */}
      {commissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Últimas Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {commissions.slice(0, 5).map((commission) => (
                <div key={commission.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{commission.sale.client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(commission.commission_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      R$ {Number(commission.commission_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      de R$ {Number(commission.sale.final_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
};

export default ProviderDashboard;