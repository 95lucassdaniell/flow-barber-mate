import { useState, useEffect } from "react";
import { Search, Users, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProviderClients, type Client } from "@/hooks/useProviderClients";
import ProviderClientsList from "./ProviderClientsList";
import ProviderClientProfile from "./ProviderClientProfile";

const ProviderClientsPage = () => {
  const { clients, loading, getTotalProviderStats } = useProviderClients();
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalStats, setTotalStats] = useState({
    totalClientsServed: 0,
    totalAppointments: 0,
    averageTicket: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const loadTotalStats = async () => {
      const stats = await getTotalProviderStats();
      setTotalStats({
        totalClientsServed: stats.totalClientsServed || 0,
        totalAppointments: stats.totalAppointments || 0,
        averageTicket: stats.averageTicket || 0,
        totalRevenue: stats.totalRevenue || 0
      });
    };

    if (!loading) {
      loadTotalStats();
    }
  }, [loading, getTotalProviderStats]);

  const handleViewClient = (client: Client) => {
    setViewingClient(client);
  };

  const handleBackToList = () => {
    setViewingClient(null);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Se estiver visualizando um cliente específico, mostrar o perfil
  if (viewingClient) {
    return (
      <ProviderClientProfile 
        client={viewingClient} 
        onBack={handleBackToList} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meus Clientes</h1>
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

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalClientsServed}</p>
                <p className="text-sm text-muted-foreground">Clientes Atendidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalAppointments}</p>
                <p className="text-sm text-muted-foreground">Total de Atendimentos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalStats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-sm text-muted-foreground">Receita Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalStats.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de clientes */}
      <ProviderClientsList
        clients={filteredClients}
        loading={loading}
        onViewClient={handleViewClient}
      />
    </div>
  );
};

export default ProviderClientsPage;