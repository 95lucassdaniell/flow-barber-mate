import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CRMDashboard from "@/components/crm/CRMDashboard";
import ClientSegments from "@/components/crm/ClientSegments";
import CampaignsManager from "@/components/crm/CampaignsManager";
import ClientProfile from "@/components/crm/ClientProfile";
import ReportsManager from "@/components/crm/ReportsManager";
import { Client } from "@/hooks/useClients";

const CRMPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Mock client para demonstração - em produção viria de uma busca real
  const mockClient: Client = {
    id: "1",
    name: "João Silva",
    phone: "(11) 99999-9999",
    email: "joao@email.com",
    birth_date: "1985-05-15",
    notes: "Cliente VIP, sempre pontual",
    barbershop_id: "barbershop-1",
    created_at: "2023-09-10T11:30:00",
    updated_at: "2024-01-15T10:30:00"
  };

  const handleClientSelect = (client?: Client) => {
    setSelectedClient(client || mockClient);
  };

  const handleBackToMain = () => {
    setSelectedClient(null);
  };

  if (selectedClient) {
    return (
      <DashboardLayout activeTab="crm">
        <ClientProfile client={selectedClient} onBack={handleBackToMain} />
      </DashboardLayout>
    );
  }

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="segments">Segmentação</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <CRMDashboard onClientSelect={handleClientSelect} />
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <ClientSegments onClientSelect={handleClientSelect} />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <CampaignsManager />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CRMPage;