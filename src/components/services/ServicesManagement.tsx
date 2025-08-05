import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, DollarSign, Clock, Scissors, CreditCard } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useAdminSubscriptionPlans } from "@/hooks/useAdminSubscriptionPlans";
import ServicesList from "./ServicesList";
import ServiceModal from "./ServiceModal";
import AdminSubscriptionPlansPage from "@/components/admin/AdminSubscriptionPlansPage";

const ServicesManagement = () => {
  const [activeTab, setActiveTab] = useState("services");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { services, loading, refetchServices } = useServices();
  const { plans } = useAdminSubscriptionPlans();

  const handleAddService = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: any) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const filteredServices = services?.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeServices = services?.filter(service => service.is_active) || [];
  const averageDuration = services?.length > 0 
    ? services.reduce((sum, service) => sum + service.duration_minutes, 0) / services.length 
    : 0;

  const activePlans = plans?.filter(plan => plan.is_active) || [];
  const averagePrice = plans?.length > 0 
    ? plans.reduce((sum, plan) => sum + plan.monthly_price, 0) / plans.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {activeTab === "services" ? "Serviços" : "Planos de Assinatura"}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === "services" 
              ? "Gerencie todos os serviços oferecidos pela sua barbearia"
              : "Gerencie os planos de assinatura para seus prestadores"
            }
          </p>
        </div>
        {activeTab === "services" && (
          <Button onClick={handleAddService} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Serviço
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Planos de Assinatura
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                <Scissors className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{services?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Serviços cadastrados
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
                <Scissors className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeServices.length}</div>
                <p className="text-xs text-muted-foreground">
                  Disponíveis para agendamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(averageDuration)}min
                </div>
                <p className="text-xs text-muted-foreground">
                  Tempo médio de serviço
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Services List */}
          <ServicesList 
            services={filteredServices}
            loading={loading}
            onEditService={handleEditService}
          />

          {/* Service Modal */}
          <ServiceModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            service={selectedService}
            onSuccess={() => refetchServices()}
          />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          {/* Stats for Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plans?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Planos cadastrados
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activePlans.length}</div>
                <p className="text-xs text-muted-foreground">
                  Disponíveis para assinatura
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {Math.round(averagePrice)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor médio mensal
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Plans Content */}
          <AdminSubscriptionPlansPage />
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default ServicesManagement;