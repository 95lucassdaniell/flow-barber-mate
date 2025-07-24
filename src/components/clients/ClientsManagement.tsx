import { useState } from "react";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClients, Client } from "@/hooks/useClients";
import ClientsList from "./ClientsList";
import ClientModal from "./ClientModal";
import ClientProfile from "@/components/crm/ClientProfile";

const ClientsManagement = () => {
  const { clients, loading } = useClients();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleViewClient = (client: Client) => {
    setViewingClient(client);
  };

  const handleBackToList = () => {
    setViewingClient(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Se estiver visualizando um cliente específico, mostrar o perfil
  if (viewingClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Lista
          </Button>
          <h1 className="text-2xl font-bold">Perfil do Cliente</h1>
        </div>
        <ClientProfile client={viewingClient} onBack={handleBackToList} />
      </div>
    );
  }

  const thisMonth = new Date();
  const newClientsThisMonth = clients.filter(client => {
    const clientDate = new Date(client.created_at);
    return clientDate.getMonth() === thisMonth.getMonth() && 
           clientDate.getFullYear() === thisMonth.getFullYear();
  }).length;

  const activeClients = clients.length; // Todos os clientes são considerados ativos

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button onClick={handleAddClient} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Cliente
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{newClientsThisMonth}</p>
                <p className="text-sm text-muted-foreground">Novos este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeClients}</p>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <ClientsList
            clients={filteredClients}
            loading={loading}
            onEditClient={handleEditClient}
            onViewClient={handleViewClient}
          />
        </CardContent>
      </Card>

      <ClientModal
        client={selectedClient}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ClientsManagement;