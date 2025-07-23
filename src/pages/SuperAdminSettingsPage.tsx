import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAuth } from "@/hooks/useSuperAuth";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import SuperAdminSettingsComponent from "@/components/super-admin/SuperAdminSettingsComponent";

export default function SuperAdminSettingsPage() {
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
      <SuperAdminSettingsComponent />
    </SuperAdminLayout>
  );
}