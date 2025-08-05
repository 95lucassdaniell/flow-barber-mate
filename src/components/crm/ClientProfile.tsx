import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Phone, Mail, MapPin, Clock, DollarSign, TrendingUp, MessageSquare, Star, Edit, Plus, CreditCard, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClientStats } from "@/hooks/useClientStats";
import { useAppointments } from "@/hooks/useAppointments";
import { useSales } from "@/hooks/useSales";
import { useClientSubscriptions } from "@/hooks/useClientSubscriptions";
import { Client } from "@/hooks/useClients";
import ClientModal from "@/components/clients/ClientModal";
import ClientSubscriptionModal from "@/components/clients/ClientSubscriptionModal";

interface ClientProfileProps {
  client: Client;
  onBack: () => void;
}

const ClientProfile = ({ client, onBack }: ClientProfileProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const { stats, loading: statsLoading, refreshStats } = useClientStats(client.id);
  const { getClientAppointments } = useAppointments();
  const { getClientSales } = useSales();
  const { 
    subscriptions, 
    loading: subscriptionsLoading, 
    cancelSubscription, 
    renewSubscription,
    refetchSubscriptions 
  } = useClientSubscriptions(client.id);
  
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

  const handleOpenSubscriptionModal = () => {
    setIsSubscriptionModalOpen(true);
  };

  const handleCloseSubscriptionModal = () => {
    setIsSubscriptionModalOpen(false);
    refetchSubscriptions();
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      await cancelSubscription(subscriptionId);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
    }
  };

  const handleRenewSubscription = async (subscriptionId: string) => {
    try {
      await renewSubscription(subscriptionId);
    } catch (error) {
      console.error("Error renewing subscription:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expirada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenSubscriptionModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Assinatura
            </Button>
            <Button variant="outline" onClick={handleEditClient} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar Cliente
            </Button>
          </div>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timeline">Histórico</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
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

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Assinaturas do Cliente</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOpenSubscriptionModal}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Assinatura
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <p className="text-muted-foreground">Carregando assinaturas...</p>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhuma assinatura encontrada</p>
                  <Button onClick={handleOpenSubscriptionModal} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Criar primeira assinatura
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((subscription) => (
                    <Card key={subscription.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{subscription.plan?.name}</h4>
                              {getStatusBadge(subscription.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Prestador: {subscription.provider?.full_name}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Valor:</span>
                                <p className="font-medium">
                                  {subscription.plan?.monthly_price?.toLocaleString('pt-BR', { 
                                    style: 'currency', 
                                    currency: 'BRL' 
                                  })}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Serviços:</span>
                                <p className="font-medium">
                                  {subscription.remaining_services}/{subscription.plan?.included_services_count}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Início:</span>
                                <p className="font-medium">
                                  {format(new Date(subscription.start_date), "dd/MM/yyyy")}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Renovação:</span>
                                <p className="font-medium">
                                  {format(new Date(subscription.end_date), "dd/MM/yyyy")}
                                </p>
                              </div>
                            </div>
                            {subscription.plan?.included_services_count && (
                              <div className="mt-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progresso dos serviços</span>
                                  <span>
                                    {subscription.plan.included_services_count - subscription.remaining_services}/
                                    {subscription.plan.included_services_count}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all" 
                                    style={{
                                      width: `${((subscription.plan.included_services_count - subscription.remaining_services) / subscription.plan.included_services_count) * 100}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            {subscription.status === 'active' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelSubscription(subscription.id)}
                                className="flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Cancelar
                              </Button>
                            )}
                            {(subscription.status === 'expired' || subscription.status === 'cancelled') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRenewSubscription(subscription.id)}
                                className="flex items-center gap-1"
                              >
                                <RefreshCw className="h-3 w-3" />
                                Renovar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
      
      {isSubscriptionModalOpen && (
        <ClientSubscriptionModal
          open={isSubscriptionModalOpen}
          onOpenChange={handleCloseSubscriptionModal}
          clientId={client.id}
        />
      )}
    </div>
  );
};

export default ClientProfile;