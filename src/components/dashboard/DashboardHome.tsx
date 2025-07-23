import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp,
  Clock,
  MessageCircle,
  Plus,
  Eye
} from "lucide-react";

const DashboardHome = () => {
  // Mock data - depois virá da API
  const stats = {
    monthlyRevenue: 8500,
    monthlyExpenses: 3200,
    monthlyProfit: 5300,
    todayAppointments: 12,
    weekAppointments: 67,
    totalClients: 234,
    inactiveClients: 15,
    messagesThisMonth: 89
  };

  const todaySchedule = [
    { time: "09:00", client: "João Silva", service: "Corte + Barba", barber: "Carlos", status: "confirmed" },
    { time: "09:30", client: "Pedro Santos", service: "Corte Masculino", barber: "Roberto", status: "confirmed" },
    { time: "10:00", client: "Marcos Lima", service: "Sobrancelha", barber: "Carlos", status: "pending" },
    { time: "10:30", client: "", service: "", barber: "", status: "available" },
    { time: "11:00", client: "Rafael Costa", service: "Corte + Barba", barber: "Roberto", status: "confirmed" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "available": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmado";
      case "pending": return "Pendente";
      case "available": return "Disponível";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicadores Financeiros - Destaque Principal */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card-gradient shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card-gradient shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                R$ {stats.monthlyExpenses.toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent-gradient shadow-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-accent-foreground/80">
              💰 Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-accent-foreground" />
              <span className="text-2xl font-bold text-accent-foreground">
                R$ {stats.monthlyProfit.toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores Operacionais */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos Hoje</p>
                <p className="text-2xl font-bold">{stats.todayAppointments}</p>
              </div>
              <Calendar className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Esta Semana</p>
                <p className="text-2xl font-bold">{stats.weekAppointments}</p>
              </div>
              <Clock className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
              </div>
              <Users className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp (Mês)</p>
                <p className="text-2xl font-bold">{stats.messagesThisMonth}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agenda de Hoje */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Agenda de Hoje</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Agendamento
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySchedule.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium w-16">
                      {appointment.time}
                    </div>
                    <div className="flex-1">
                      {appointment.client ? (
                        <>
                          <p className="font-medium">{appointment.client}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.service} • {appointment.barber}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground italic">Horário disponível</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className={getStatusColor(appointment.status)}>
                    {getStatusText(appointment.status)}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                Ver Agenda Completa
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alertas e Ações Rápidas */}
        <div className="space-y-6">
          {/* Clientes Inativos */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-lg">⚠️ Retenção</CardTitle>
              <CardDescription>Clientes que precisam de atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-medium text-yellow-800">
                    {stats.inactiveClients} clientes inativos
                  </p>
                  <p className="text-sm text-yellow-600">
                    Não agendam há mais de 60 dias
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    Campanhas de Reativação
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800">
                    5 aniversariantes hoje
                  </p>
                  <p className="text-sm text-blue-600">
                    Mensagens automáticas enviadas
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    Ver Campanhas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-lg">⚡ Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cliente
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Horário
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Lançar Despesa
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Enviar WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;