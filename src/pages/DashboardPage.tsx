import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHome from "@/components/dashboard/DashboardHome";

const DashboardPage = () => {
  return (
    <DashboardLayout activeTab="dashboard">
      <DashboardHome />
    </DashboardLayout>
  );
};

export default DashboardPage;