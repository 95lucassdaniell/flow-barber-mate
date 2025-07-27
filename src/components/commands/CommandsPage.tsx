import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Receipt, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  Eye,
  DollarSign 
} from "lucide-react";
import { useCommands } from "@/hooks/useCommands";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommandModal from "./CommandModal";
import CloseCommandModal from "./CloseCommandModal";

const CommandsPage = () => {
  const { commands, loading } = useCommands();
  const [selectedCommand, setSelectedCommand] = useState<any>(null);
  const [commandModalOpen, setCommandModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("open");

  const openCommands = commands.filter(cmd => cmd.status === 'open');
  const closedCommands = commands.filter(cmd => cmd.status === 'closed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'closed':
        return 'Fechada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const handleViewCommand = (command: any) => {
    setSelectedCommand(command);
    setCommandModalOpen(true);
  };

  const handleCloseCommand = (command: any) => {
    setSelectedCommand(command);
    setCloseModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Comandas</h1>
            <p className="text-muted-foreground">
              Gerencie as comandas dos agendamentos
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comandas</h1>
          <p className="text-muted-foreground">
            Gerencie as comandas dos agendamentos
          </p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comandas Abertas</p>
                <p className="text-2xl font-bold">{openCommands.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fechadas Hoje</p>
                <p className="text-2xl font-bold">
                  {closedCommands.filter(cmd => 
                    format(new Date(cmd.closed_at || ''), 'yyyy-MM-dd') === 
                    format(new Date(), 'yyyy-MM-dd')
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total do Dia</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    closedCommands
                      .filter(cmd => 
                        format(new Date(cmd.closed_at || ''), 'yyyy-MM-dd') === 
                        format(new Date(), 'yyyy-MM-dd')
                      )
                      .reduce((sum, cmd) => sum + cmd.total_amount, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de comandas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="open" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Abertas ({openCommands.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Fechadas ({closedCommands.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {openCommands.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma comanda aberta</h3>
                <p className="text-muted-foreground">
                  As comandas aparecerão aqui quando os agendamentos forem criados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openCommands.map((command) => (
                <Card key={command.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Comanda #{command.command_number}
                      </CardTitle>
                      <Badge className={getStatusColor(command.status)}>
                        {getStatusText(command.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{command.client?.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Barbeiro</p>
                      <p className="font-medium">{command.barber?.full_name}</p>
                    </div>

                    {command.appointment && (
                      <div>
                        <p className="text-sm text-muted-foreground">Agendamento</p>
                        <p className="font-medium">
                          {format(new Date(command.appointment.appointment_date), 'dd/MM/yyyy', { locale: ptBR })} às {command.appointment.start_time}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-bold text-lg">{formatCurrency(command.total_amount)}</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewCommand(command)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleCloseCommand(command)}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Fechar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          {closedCommands.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma comanda fechada</h3>
                <p className="text-muted-foreground">
                  As comandas fechadas aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedCommands.map((command) => (
                <Card key={command.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Comanda #{command.command_number}
                      </CardTitle>
                      <Badge className={getStatusColor(command.status)}>
                        {getStatusText(command.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{command.client?.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Barbeiro</p>
                      <p className="font-medium">{command.barber?.full_name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Fechada em</p>
                      <p className="font-medium">
                        {command.closed_at && format(new Date(command.closed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-bold text-lg">{formatCurrency(command.total_amount)}</p>
                    </div>

                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewCommand(command)}
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <CommandModal
        command={selectedCommand}
        isOpen={commandModalOpen}
        onClose={() => {
          setCommandModalOpen(false);
          setSelectedCommand(null);
        }}
      />

      <CloseCommandModal
        command={selectedCommand}
        isOpen={closeModalOpen}
        onClose={() => {
          setCloseModalOpen(false);
          setSelectedCommand(null);
        }}
      />
    </div>
  );
};

export default CommandsPage;