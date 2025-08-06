import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProvidersFinancialDashboard from "@/components/financial/ProvidersFinancialDashboard";
import FinancialFilters from "@/components/financial/FinancialFilters";
import { useFinancialData } from "@/hooks/useFinancialData";

export default function FinancialProvidersPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedBarber, setSelectedBarber] = useState<string>('all');

  const { barberRankings, commissions, loading: dataLoading } = useFinancialData(
    dateRange.startDate,
    dateRange.endDate,
    selectedBarber === 'all' ? undefined : selectedBarber
  );

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
    <DashboardLayout activeTab="financial-providers">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prestadores</h1>
          <p className="text-muted-foreground">
            Rankings e desempenho financeiro dos prestadores de serviço
          </p>
        </div>

        <FinancialFilters
          dateRange={dateRange}
          selectedBarber={selectedBarber}
          onDateRangeChange={setDateRange}
          onBarberChange={setSelectedBarber}
        />

        <ProvidersFinancialDashboard 
          rankings={barberRankings}
          commissions={commissions}
          loading={dataLoading}
        />
      </div>
    </DashboardLayout>
  );
}