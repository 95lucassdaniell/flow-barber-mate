import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, CreditCard, DollarSign } from "lucide-react";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useSubscriptionFinancialData } from "@/hooks/useSubscriptionFinancialData";
import FinancialStats from "./FinancialStats";
import SubscriptionFinancialStats from "./SubscriptionFinancialStats";
import CommissionHistory from "./CommissionHistory";
import FinancialFilters from "./FinancialFilters";
import SubscriptionBillingList from "./SubscriptionBillingList";
import ProvidersFinancialDashboard from "./ProvidersFinancialDashboard";
import ExpenseManagement from "./ExpenseManagement";
import CashRegisterHistory from "./CashRegisterHistory";
import { format } from "date-fns";

export default function AdminFinancialDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedBarber, setSelectedBarber] = useState<string>("");

  // Memoizar parâmetros para evitar re-renders desnecessários
  const financialParams = useMemo(() => ({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    barberId: selectedBarber || undefined
  }), [dateRange.startDate, dateRange.endDate, selectedBarber]);

  const { 
    stats, 
    barberRankings, 
    commissions, 
    loading, 
    statsLoading, 
    rankingsLoading, 
    commissionsLoading 
  } = useFinancialData(
    financialParams.startDate,
    financialParams.endDate,
    financialParams.barberId
  );

  const {
    stats: subscriptionStats,
    loading: subscriptionLoading
  } = useSubscriptionFinancialData(
    financialParams.startDate,
    financialParams.endDate
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calcular métricas agregadas para o dashboard
  const totalRevenue = stats?.totalRevenue || 0;
  const totalCommissions = stats?.totalCommissions || 0;
  const totalSales = stats?.totalSales || 0;
  const averageTicket = stats?.averageTicket || 0;

  const subscriptionRevenue = subscriptionStats?.monthly_revenue || 0;
  const activeSubscriptions = subscriptionStats?.active_subscriptions || 0;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <FinancialFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedBarber={selectedBarber}
        onBarberChange={setSelectedBarber}
        showBarberFilter={true}
      />

      {/* Dashboard Financeiro Geral */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h2>
          <p className="text-muted-foreground">
            Visão geral das métricas financeiras da barbearia
          </p>
        </div>

        {/* Métricas Principais */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comissões Pagas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
                  <p className="text-2xl font-bold text-purple-600">{totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold text-orange-600">
                    R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Assinaturas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Receita de Assinaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubscriptionFinancialStats 
              stats={subscriptionStats} 
              loading={subscriptionLoading} 
            />
          </CardContent>
        </Card>
      </div>

      {/* Submenu das Seções Financeiras */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Seções Financeiras</h2>
          <p className="text-muted-foreground">
            Acesse informações detalhadas por categoria
          </p>
        </div>

        <Tabs defaultValue="subscriptions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
            <TabsTrigger value="providers">Prestadores</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="space-y-4">
            <SubscriptionBillingList />
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Histórico Completo de Comissões
                </CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length > 0 ? (
                  <CommissionHistory commissions={commissions} showBarberColumn={true} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma comissão encontrada para o período selecionado.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <ProvidersFinancialDashboard 
              rankings={barberRankings}
              commissions={commissions}
              loading={rankingsLoading || commissionsLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Seção de Gestão Adicional */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Gestão Financeira</h2>
          <p className="text-muted-foreground">
            Ferramentas de gestão e controle financeiro
          </p>
        </div>

        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="cash-history">Histórico de Caixa</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-4">
            <ExpenseManagement />
          </TabsContent>

          <TabsContent value="cash-history" className="space-y-4">
            <CashRegisterHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}