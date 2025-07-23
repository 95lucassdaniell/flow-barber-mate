import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProvidersManagement from "@/components/providers/ProvidersManagement";

const ProvidersPage = () => {
  return (
    <DashboardLayout activeTab="providers">
      <ProvidersManagement />
    </DashboardLayout>
  );
};

export default ProvidersPage;