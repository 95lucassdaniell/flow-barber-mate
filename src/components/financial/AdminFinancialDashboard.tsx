import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinancialData } from "@/hooks/useFinancialData";
import FinancialStats from "./FinancialStats";
import CommissionHistory from "./CommissionHistory";
import FinancialFilters from "./FinancialFilters";
import BarberRankings from "./BarberRankings";
import { format } from "date-fns";

export default function AdminFinancialDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedBarber, setSelectedBarber] = useState<string>("");

  const { stats, barberRankings, commissions, loading } = useFinancialData(
    dateRange.startDate,
    dateRange.endDate,
    selectedBarber || undefined
  );

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
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance dos Barbeiros</CardTitle>
              </CardHeader>
              <CardContent>
                <BarberRankings rankings={barberRankings.slice(0, 5)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimas Comissões</CardTitle>
              </CardHeader>
              <CardContent>
                <CommissionHistory 
                  commissions={commissions.slice(0, 5)} 
                  showBarberColumn={true}
                  compact={true}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking Completo dos Barbeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <BarberRankings rankings={barberRankings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Completo de Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              <CommissionHistory commissions={commissions} showBarberColumn={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}