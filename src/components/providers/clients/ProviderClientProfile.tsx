import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Phone, Mail, Clock, DollarSign, ArrowLeft, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProviderClients, type Client, type ProviderClientStats } from "@/hooks/useProviderClients";
import { useProviderAuth } from "@/hooks/useProviderAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProviderClientProfileProps {
  client: Client;
  onBack: () => void;
}

const ProviderClientProfile = ({ client, onBack }: ProviderClientProfileProps) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<ProviderClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { getProviderClientStats } = useProviderClients();
  const { profile } = useProviderAuth();
  
  const joinDate = new Date(client.created_at);

  useEffect(() => {
    const loadClientData = async () => {
      if (!profile?.id || !profile?.barbershop_id) return;
      
      setLoading(true);
      
      try {
        // Buscar agendamentos do cliente com este prestador
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            start_time,
            end_time,
            total_price,
            status,
            notes,
            services(name),
            created_at
          `)
          .eq('client_id', client.id)
          .eq('barber_id', profile.id)
          .eq('barbershop_id', profile.barbershop_id)
          .order('appointment_date', { ascending: false });

        if (appointmentsError) {
          console.error('Erro ao buscar agendamentos:', appointmentsError);
        } else {
          setAppointments(appointmentsData || []);
        }

        // Carregar estatísticas
        const statsData = await getProviderClientStats(client.id);
        setStats(statsData);
      } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, [client.id, profile?.id, profile?.barbershop_id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Agendado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Histórico do Cliente</h1>
      </div>

      <Card>
        <CardHeader>
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
                <p className="text-sm font-medium">Último Atendimento</p>
                <p className="text-sm text-muted-foreground">
                  {loading ? "..." : (stats?.lastAppointmentDate ? format(stats.lastAppointmentDate, "dd/MM/yyyy", { locale: ptBR }) : "Nunca")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Gasto Comigo</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? "..." : (stats?.totalRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Atendimentos</p>
              <p className="text-2xl font-bold">{loading ? "..." : stats?.totalAppointments || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
              <p className="text-2xl font-bold text-blue-600">
                {loading ? "..." : (stats?.averageTicket || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>

          {stats?.favoriteServices && stats.favoriteServices.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Serviços Favoritos</p>
              <div className="flex flex-wrap gap-2">
                {stats.favoriteServices.map((service, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appointments">Histórico de Atendimentos</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atendimentos Realizados ({appointments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-muted-foreground">Nenhum atendimento encontrado</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{appointment.services?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.appointment_date), "dd/MM/yyyy")} às {appointment.start_time}
                        </p>
                        {appointment.notes && (
                          <p className="text-xs text-muted-foreground">
                            Obs: {appointment.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-medium">
                          {appointment.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
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
                  <h4 className="font-medium mb-2">Serviços Favoritos Comigo</h4>
                  <div className="flex flex-wrap gap-2">
                    {loading ? (
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
                    <h4 className="font-medium mb-2">Observações Gerais</h4>
                    <p className="text-sm text-muted-foreground">{client.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderClientProfile;