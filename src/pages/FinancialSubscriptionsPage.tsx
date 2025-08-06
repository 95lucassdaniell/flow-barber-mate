import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminSubscriptionPlansPage from "@/components/admin/AdminSubscriptionPlansPage";

export default function FinancialSubscriptionsPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

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
            Gerencie os planos de assinatura e controle de clientes
          </p>
        </div>

        <AdminSubscriptionPlansPage />
      </div>
    </DashboardLayout>
  );
}