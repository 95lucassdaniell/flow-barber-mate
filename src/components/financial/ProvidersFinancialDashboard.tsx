import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Award, TrendingUp, Users, DollarSign } from "lucide-react";
import BarberRankings from "./BarberRankings";
import CommissionHistory from "./CommissionHistory";
import type { BarberRanking, CommissionData } from "@/hooks/useFinancialData";

interface ProvidersFinancialDashboardProps {
  rankings: BarberRanking[];
  commissions: CommissionData[];
  loading?: boolean;
}

export default function ProvidersFinancialDashboard({ 
  rankings, 
  commissions, 
  loading = false 
}: ProvidersFinancialDashboardProps) {
  const [activeTab, setActiveTab] = useState("rankings");

  // Estatísticas dos prestadores
  const totalProviders = rankings.length;
  const activeProviders = rankings.filter(r => r.salesCount > 0).length;
  const totalCommissions = rankings.reduce((sum, r) => sum + r.totalCommissions, 0);
  const averageCommission = totalProviders > 0 ? totalCommissions / totalProviders : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas dos Prestadores */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Prestadores</p>
                <p className="text-2xl font-bold">{totalProviders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prestadores Ativos</p>
                <p className="text-2xl font-bold text-green-600">{activeProviders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Comissões</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Média de Comissões</p>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {averageCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Rankings e Comissões */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="commissions">Comissões Detalhadas</TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Ranking de Performance dos Prestadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rankings.length > 0 ? (
                <BarberRankings rankings={rankings} />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum dado de performance encontrado para o período selecionado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Histórico Detalhado de Comissões dos Prestadores
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
      </Tabs>
    </div>
  );
}