import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CouponsManagement } from "@/components/coupons/CouponsManagement";

const CouponsPage = () => {
  return (
    <DashboardLayout activeTab="coupons">
      <CouponsManagement />
    </DashboardLayout>
  );
};

export default CouponsPage;