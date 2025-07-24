import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Phone, Mail, MapPin, Clock, DollarSign, TrendingUp, MessageSquare, Star, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClientStats } from "@/hooks/useClientStats";
import { useAppointments } from "@/hooks/useAppointments";
import { useSales } from "@/hooks/useSales";
import { Client } from "@/hooks/useClients";
import ClientModal from "@/components/clients/ClientModal";

interface ClientProfileProps {
  client: Client;
  onBack: () => void;
}

const ClientProfile = ({ client, onBack }: ClientProfileProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const { stats, loading: statsLoading, refreshStats } = useClientStats(client.id);
  const { getClientAppointments } = useAppointments();
  const { getClientSales } = useSales();
  
  const joinDate = new Date(client.created_at);

  useEffect(() => {
    const loadClientData = async () => {
      const [appointmentsData, salesData] = await Promise.all([
        getClientAppointments(client.id),
        getClientSales(client.id)
      ]);
      setAppointments(appointmentsData);
      setSales(salesData);
    };

    loadClientData();
  }, [client.id]);

  const handleEditClient = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    refreshStats();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold">
                {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{client.name}</h2>
              <p className="text-muted-foreground">Cliente desde {format(joinDate, "MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleEditClient} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar Cliente
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Telefone</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
            </div>
            {client.email && (
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>
            )}
            {client.birth_date && (
              <div className="flex items-center space-x-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Aniversário</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(client.birth_date), "dd/MM", { locale: ptBR })}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Última Visita</p>
                <p className="text-sm text-muted-foreground">
                  {statsLoading ? "..." : (stats?.lastVisit ? format(stats.lastVisit, "dd/MM/yyyy", { locale: ptBR }) : "Nunca")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Gasto</p>
              <p className="text-2xl font-bold text-green-600">
                {statsLoading ? "..." : (stats?.totalSpent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Agendamentos</p>
              <p className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalAppointments || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold text-blue-600">
                {statsLoading ? "..." : (stats?.averageTicket || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Última Visita</p>
              <p className="text-lg font-semibold">
                {statsLoading ? "..." : (stats?.lastVisit ? format(stats.lastVisit, "dd 'de' MMMM", { locale: ptBR }) : "Nunca")}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Serviços Favoritos</p>
              <p className="text-lg font-semibold">
                {statsLoading ? "..." : (stats?.favoriteServices?.join(", ") || "Nenhum")}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Frequência</p>
              <p className="text-lg font-semibold">
                {statsLoading ? "..." : (stats?.visitFrequency ? `${Math.round(stats.visitFrequency)} dias` : "N/A")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Histórico</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.slice(0, 10).map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{appointment.services?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(appointment.appointment_date), "dd/MM/yyyy")} às {appointment.start_time}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Barbeiro: {appointment.profiles?.full_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {appointment.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <Badge variant={appointment.status === 'completed' ? 'default' : appointment.status === 'cancelled' ? 'destructive' : 'secondary'}>
                            {appointment.status === 'completed' ? 'Concluído' : appointment.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Compras</CardTitle>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma compra encontrada</p>
                ) : (
                  <div className="space-y-3">
                    {sales.slice(0, 10).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">
                            Venda #{sale.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(sale.sale_date), "dd/MM/yyyy")} às {sale.sale_time}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Barbeiro: {sale.profiles?.full_name}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {sale.sale_items?.map((item: any, index: number) => (
                              <span key={index}>
                                {item.services?.name || item.products?.name} ({item.quantity}x)
                                {index < sale.sale_items.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {sale.final_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {sale.payment_method}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Serviços Favoritos</h4>
                  <div className="flex flex-wrap gap-2">
                    {statsLoading ? (
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    ) : (
                      stats?.favoriteServices?.map((service, index) => (
                        <Badge key={index} variant="outline">{service}</Badge>
                      )) || <p className="text-sm text-muted-foreground">Nenhum serviço favorito ainda</p>
                    )}
                  </div>
                </div>
                {client.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Observações</h4>
                    <p className="text-sm text-muted-foreground">{client.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades de Negócio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Gastos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Gasto</span>
                  <span className="font-semibold">
                    {statsLoading ? "..." : (stats?.totalSpent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Número de Compras</span>
                  <span className="font-semibold">{statsLoading ? "..." : stats?.totalPurchases || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ticket Médio</span>
                  <span className="font-semibold">
                    {statsLoading ? "..." : (stats?.averageTicket || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Agendamentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total de Agendamentos</span>
                  <span className="font-semibold">{statsLoading ? "..." : stats?.totalAppointments || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Agendamentos Concluídos</span>
                  <span className="font-semibold">{statsLoading ? "..." : stats?.completedAppointments || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Frequência Média</span>
                  <span className="font-semibold">
                    {statsLoading ? "..." : (stats?.visitFrequency ? `${Math.round(stats.visitFrequency)} dias` : "N/A")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {isEditModalOpen && (
        <ClientModal
          client={client}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  );
};

export default ClientProfile;