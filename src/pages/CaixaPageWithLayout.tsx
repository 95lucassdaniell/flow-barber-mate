import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CaixaPage from "@/components/caixa/CaixaPage";

const CaixaPageWithLayout = () => {
  return (
    <DashboardLayout activeTab="caixa">
      <CaixaPage />
    </DashboardLayout>
  );
};

export default CaixaPageWithLayout;