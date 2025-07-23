import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ServicesManagement from "@/components/services/ServicesManagement";

const ServicesPage = () => {
  return (
    <DashboardLayout activeTab="services">
      <ServicesManagement />
    </DashboardLayout>
  );
};

export default ServicesPage;