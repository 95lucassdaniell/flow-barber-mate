import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GoalsManagement from "@/components/goals/GoalsManagement";

const GoalsPage = () => {
  return (
    <DashboardLayout activeTab="metas">
      <GoalsManagement />
    </DashboardLayout>
  );
};

export default GoalsPage;