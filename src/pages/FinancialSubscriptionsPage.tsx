import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminSubscriptionPlansPage from "@/components/admin/AdminSubscriptionPlansPage";
import SubscriptionFinancialStats from "@/components/financial/SubscriptionFinancialStats";
import SubscriptionBillingList from "@/components/financial/SubscriptionBillingList";
import FinancialFilters from "@/components/financial/FinancialFilters";
import { useIntelligentSubscriptionData } from "@/hooks/useIntelligentSubscriptionData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Settings, DollarSign } from "lucide-react";

export default function FinancialSubscriptionsPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Memoizar parâmetros para evitar re-renders desnecessários
  const financialParams = useMemo(() => ({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  }), [dateRange.startDate, dateRange.endDate]);

  const {
    stats: subscriptionStats,
    billings,
    loading: subscriptionLoading,
    fromCache
  } = useIntelligentSubscriptionData(financialParams);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && profile && profile.role !== 'admin') {
      navigate('/login');
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout activeTab="financial-subscriptions">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assinaturas</h1>
          <p className="text-muted-foreground">
            Gerencie planos de assinatura e acompanhe dados financeiros
          </p>
        </div>

        {/* Filtros */}
        <FinancialFilters
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedBarber=""
          onBarberChange={() => {}}
          showBarberFilter={false}
        />

        {/* Estatísticas Financeiras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SubscriptionFinancialStats 
              stats={subscriptionStats} 
              loading={subscriptionLoading}
              fromCache={fromCache}
            />
          </CardContent>
        </Card>

        {/* Seções Principais */}
        <Tabs defaultValue="billing" className="space-y-4">
          <TabsList>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cobranças e Faturas
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Gerenciar Planos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="billing" className="space-y-4">
            <SubscriptionBillingList 
              billings={billings}
              loading={subscriptionLoading}
              fromCache={fromCache}
            />
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <AdminSubscriptionPlansPage />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}