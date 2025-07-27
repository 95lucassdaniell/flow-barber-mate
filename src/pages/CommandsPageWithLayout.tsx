import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CommandsPage from "@/components/commands/CommandsPage";

const CommandsPageWithLayout = () => {
  return (
    <DashboardLayout activeTab="comandas">
      <CommandsPage />
    </DashboardLayout>
  );
};

export default CommandsPageWithLayout;