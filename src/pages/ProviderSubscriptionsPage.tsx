import ProviderDashboardLayout from "@/components/providers/dashboard/ProviderDashboardLayout";
import ProviderSubscriptionPlansPage from "@/components/providers/subscriptions/ProviderSubscriptionPlansPage";

const ProviderSubscriptionsPage = () => {
  return (
    <ProviderDashboardLayout activeTab="assinaturas">
      <div className="p-6">
        <ProviderSubscriptionPlansPage />
      </div>
    </ProviderDashboardLayout>
  );
};

export default ProviderSubscriptionsPage;