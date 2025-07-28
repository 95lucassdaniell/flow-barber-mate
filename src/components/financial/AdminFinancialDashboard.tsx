import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinancialData } from "@/hooks/useFinancialData";
import FinancialStats from "./FinancialStats";
import CommissionHistory from "./CommissionHistory";
import FinancialFilters from "./FinancialFilters";
import BarberRankings from "./BarberRankings";
import ExpenseManagement from "./ExpenseManagement";
import CashRegisterHistory from "./CashRegisterHistory";
import { format } from "date-fns";

export default function AdminFinancialDashboard() {
  // Definir período padrão para os últimos 30 dias
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedBarber, setSelectedBarber] = useState<string>("");

  const { 
    stats, 
    barberRankings, 
    commissions, 
    loading, 
    statsLoading, 
    rankingsLoading, 
    commissionsLoading 
  } = useFinancialData(
    dateRange.startDate,
    dateRange.endDate,
    selectedBarber || undefined
  );

  // Debug logs para verificar os dados
  console.log('AdminFinancialDashboard - Date range:', dateRange);
  console.log('AdminFinancialDashboard - Selected barber:', selectedBarber);
  console.log('AdminFinancialDashboard - Stats:', stats);
  console.log('AdminFinancialDashboard - Barber rankings:', barberRankings);
  console.log('AdminFinancialDashboard - Commissions count:', commissions?.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FinancialFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedBarber={selectedBarber}
        onBarberChange={setSelectedBarber}
        showBarberFilter={true}
      />

      <FinancialStats stats={stats} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="cash-history">Histórico de Caixa</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Performance dos Barbeiros
                  {rankingsLoading && (
                    <div className="inline-flex items-center ml-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Atualizando rankings...</span>
                  </div>
                ) : barberRankings.length > 0 ? (
                  <BarberRankings rankings={barberRankings.slice(0, 5)} />
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum dado encontrado para o período selecionado
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas Comissões</CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length > 0 ? (
                  <CommissionHistory 
                    commissions={commissions.slice(0, 5)} 
                    showBarberColumn={true}
                    compact={true}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma comissão encontrada para o período selecionado
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Ranking Completo dos Barbeiros
                  {rankingsLoading && (
                    <div className="inline-flex items-center ml-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Atualizando rankings...</span>
                  </div>
                ) : barberRankings.length > 0 ? (
                  <BarberRankings rankings={barberRankings} />
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum dado encontrado para o período selecionado
                  </p>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Completo de Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              {commissions.length > 0 ? (
                <CommissionHistory commissions={commissions} showBarberColumn={true} />
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma comissão encontrada para o período selecionado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseManagement />
        </TabsContent>

        <TabsContent value="cash-history" className="space-y-4">
          <CashRegisterHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}