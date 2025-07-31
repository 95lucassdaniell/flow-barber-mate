import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, BarChart3, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProviderAuth } from "@/hooks/useProviderAuth";
import { useProviderCommissions } from "@/hooks/useProviderCommissions";
import CommissionHistory from "@/components/financial/CommissionHistory";
import FinancialFilters from "@/components/financial/FinancialFilters";

export default function ProviderCommissionsPage() {
  const { profile } = useProviderAuth();
  
  // Date range state - default to current month
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Fetch commission data for the current provider
  const {
    stats,
    commissions,
    loading,
    error
  } = useProviderCommissions(
    dateRange.startDate,
    dateRange.endDate
  );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center text-destructive py-8">
          <h3 className="text-lg font-medium mb-2">Erro ao carregar dados</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Minhas Comissões</h1>
        <p className="text-muted-foreground">
          Acompanhe o histórico e performance das suas comissões
        </p>
      </div>

      {/* Filters */}
      <FinancialFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showBarberFilter={false} // Hide barber filter since it's the provider's own page
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalCommissions || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total das vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade de Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground">
              Vendas realizadas
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
              {formatCurrency(stats?.averageTicket || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por venda realizada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Rate Info - Temporarily hidden until we confirm the field exists */}

      {/* Commission History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
          <p className="text-sm text-muted-foreground">
            Detalhamento completo das suas comissões no período selecionado
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <CommissionHistory 
            commissions={commissions || []} 
            showBarberColumn={false} // Don't show barber column since it's the provider's own page
          />
        </CardContent>
      </Card>

      {/* Empty State */}
      {commissions && commissions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhuma comissão encontrada</h3>
              <p className="text-sm">
                Não há comissões registradas no período selecionado.
                <br />
                Ajuste o filtro de datas para ver mais resultados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}