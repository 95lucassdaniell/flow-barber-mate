import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BarberFinancialDashboard from "@/components/financial/BarberFinancialDashboard";
import AdminFinancialDashboard from "@/components/financial/AdminFinancialDashboard";

export default function FinancialDashboardPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const isAdmin = profile.role === 'admin';

  return (
    <DashboardLayout activeTab="financial-dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Geral</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Visão geral das finanças da barbearia e performance da equipe"
              : "Acompanhe suas comissões e performance"
            }
          </p>
        </div>

        {isAdmin ? (
          <AdminFinancialDashboard />
        ) : (
          <BarberFinancialDashboard />
        )}
      </div>
    </DashboardLayout>
  );
}