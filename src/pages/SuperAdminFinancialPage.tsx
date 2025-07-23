import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAuth } from "@/hooks/useSuperAuth";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import FinancialDashboard from "@/components/super-admin/FinancialDashboard";

export default function SuperAdminFinancialPage() {
  const { isSuperAdmin, loading } = useSuperAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      navigate('/login');
    }
  }, [isSuperAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <SuperAdminLayout activeTab="financial">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
          <p className="text-muted-foreground">
            Gerencie contas, planos e cobrança das barbearias
          </p>
        </div>
        <FinancialDashboard />
      </div>
    </SuperAdminLayout>
  );
}