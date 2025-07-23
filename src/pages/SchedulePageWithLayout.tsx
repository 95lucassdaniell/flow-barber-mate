import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SchedulePage from "@/components/schedule/SchedulePage";

const SchedulePageWithLayout = () => {
  return (
    <DashboardLayout activeTab="agenda">
      <SchedulePage />
    </DashboardLayout>
  );
};

export default SchedulePageWithLayout;