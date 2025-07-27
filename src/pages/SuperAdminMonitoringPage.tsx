import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAuth } from "@/hooks/useSuperAuth";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import SystemOverview from "@/components/super-admin/monitoring/SystemOverview";
import ArchiveMonitoring from "@/components/super-admin/monitoring/ArchiveMonitoring";
import PerformanceCharts from "@/components/super-admin/monitoring/PerformanceCharts";
import PostgreSQLMonitoring from "@/components/super-admin/monitoring/PostgreSQLMonitoring";
import MaintenanceControls from "@/components/super-admin/monitoring/MaintenanceControls";

export default function SuperAdminMonitoringPage() {
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
    <SuperAdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento do Sistema</h1>
          <p className="text-muted-foreground">
            Acompanhe a performance e saúde do sistema em tempo real
          </p>
        </div>

        <SystemOverview />
        <PerformanceCharts />
        <PostgreSQLMonitoring />
        <ArchiveMonitoring />
        <MaintenanceControls />
      </div>
    </SuperAdminLayout>
  );
}