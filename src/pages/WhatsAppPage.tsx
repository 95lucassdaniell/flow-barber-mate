import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WhatsAppManagement from "@/components/whatsapp/WhatsAppManagement";

const WhatsAppPage = () => {
  return (
    <DashboardLayout activeTab="whatsapp">
      <WhatsAppManagement />
    </DashboardLayout>
  );
};

export default WhatsAppPage;