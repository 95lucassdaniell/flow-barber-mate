import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CRMDashboard from "@/components/crm/CRMDashboard";
import ClientSegments from "@/components/crm/ClientSegments";
import CampaignsManager from "@/components/crm/CampaignsManager";

const CRMPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <DashboardLayout activeTab="crm">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground">
            Gerencie relacionamentos com clientes, análises e campanhas
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="segments">Segmentação</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <CRMDashboard />
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <ClientSegments />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <CampaignsManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CRMPage;