import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ClientsManagement from "@/components/clients/ClientsManagement";

const ClientsPage = () => {
  return (
    <DashboardLayout activeTab="clients">
      <ClientsManagement />
    </DashboardLayout>
  );
};

export default ClientsPage;