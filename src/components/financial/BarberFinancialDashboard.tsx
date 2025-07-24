import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useAuth } from "@/hooks/useAuth";
import FinancialStats from "./FinancialStats";
import CommissionHistory from "./CommissionHistory";
import FinancialFilters from "./FinancialFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BarberFinancialDashboard() {
  const { profile } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const { stats, commissions, loading } = useFinancialData(
    dateRange.startDate,
    dateRange.endDate,
    profile?.id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: ptBR });

  return (
    <div className="space-y-6">
      <FinancialFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showBarberFilter={false}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comissões {currentMonth}
            </CardTitle>
            <Badge variant="secondary">R$</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vendas Realizadas
            </CardTitle>
            <Badge variant="secondary">#</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Médio
            </CardTitle>
            <Badge variant="secondary">R$</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Volume Total Vendido
            </CardTitle>
            <Badge variant="secondary">R$</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <CommissionHistory commissions={commissions} showBarberColumn={false} />
        </CardContent>
      </Card>
    </div>
  );
}