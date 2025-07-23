import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Phone, 
  Scissors, 
  Clock, 
  DollarSign,
  Calendar,
  Plus,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTime?: string | null;
  appointment?: any; // Para edição
}

export const AppointmentModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  selectedTime,
  appointment 
}: AppointmentModalProps) => {
  const [step, setStep] = useState<"client" | "details">("client");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newClientData, setNewClientData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const [appointmentData, setAppointmentData] = useState({
    barberId: "",
    serviceId: "",
    time: selectedTime || "",
    notes: ""
  });

  // Mock data - virá da API
  const mockClients = [
    { id: "1", name: "João Silva", phone: "(11) 99999-9999", email: "joao@email.com" },
    { id: "2", name: "Pedro Santos", phone: "(11) 88888-8888", email: "pedro@email.com" },
    { id: "3", name: "Marcos Lima", phone: "(11) 77777-7777", email: "marcos@email.com" }
  ];

  const mockBarbers = [
    { id: "1", name: "Carlos Silva" },
    { id: "2", name: "Roberto Santos" }
  ];

  const mockServices = [
    { id: "1", name: "Corte Masculino", duration: 30, price: 25.00 },
    { id: "2", name: "Corte + Barba", duration: 45, price: 45.00 },
    { id: "3", name: "Sobrancelha", duration: 15, price: 15.00 },
    { id: "4", name: "Bigode", duration: 15, price: 10.00 }
  ];

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setStep("details");
  };

  const handleNewClient = () => {
    if (newClientData.name && newClientData.phone) {
      const newClient = {
        id: Date.now().toString(),
        ...newClientData
      };
      setSelectedClient(newClient);
      setStep("details");
    }
  };

  const handleSaveAppointment = () => {
    const selectedService = mockServices.find(s => s.id === appointmentData.serviceId);
    
    console.log("Saving appointment:", {
      client: selectedClient,
      date: selectedDate,
      time: appointmentData.time,
      barber: appointmentData.barberId,
      service: selectedService,
      notes: appointmentData.notes
    });
    
    // Aqui faria a chamada para a API
    onClose();
  };

  const selectedService = mockServices.find(s => s.id === appointmentData.serviceId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>
              {appointment ? "Editar Agendamento" : "Novo Agendamento"}
            </span>
          </DialogTitle>
          <p className="text-muted-foreground">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              step === "client" ? "text-accent" : "text-green-600"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === "client" ? "bg-accent text-accent-foreground" : "bg-green-100 text-green-600"
              }`}>
                {step === "details" ? "✓" : "1"}
              </div>
              <span className="font-medium">Cliente</span>
            </div>
            
            <div className="h-px bg-border flex-1" />
            
            <div className={`flex items-center space-x-2 ${
              step === "details" ? "text-accent" : "text-muted-foreground"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === "details" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}>
                2
              </div>
              <span className="font-medium">Detalhes</span>
            </div>
          </div>

          {/* Etapa 1: Seleção do Cliente */}
          {step === "client" && (
            <div className="space-y-4">
              <div>
                <Label>Buscar Cliente Existente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Digite o nome ou telefone do cliente..." 
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Clientes Recentes</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {mockClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/50"
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Selecionar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Ou Cadastrar Novo Cliente</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="name">Nome Completo*</Label>
                    <Input
                      id="name"
                      value={newClientData.name}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp*</Label>
                    <Input
                      id="phone"
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleNewClient}
                  disabled={!newClientData.name || !newClientData.phone}
                  className="w-full mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar e Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Etapa 2: Detalhes do Agendamento */}
          {step === "details" && selectedClient && (
            <div className="space-y-4">
              {/* Cliente Selecionado */}
              <div className="bg-accent/10 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedClient.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{selectedClient.phone}</span>
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setStep("client")}
                  >
                    Alterar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profissional */}
                <div>
                  <Label>Profissional</Label>
                  <Select 
                    value={appointmentData.barberId} 
                    onValueChange={(value) => setAppointmentData(prev => ({ ...prev, barberId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockBarbers.map((barber) => (
                        <SelectItem key={barber.id} value={barber.id}>
                          {barber.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Serviço */}
                <div>
                  <Label>Serviço</Label>
                  <Select 
                    value={appointmentData.serviceId} 
                    onValueChange={(value) => setAppointmentData(prev => ({ ...prev, serviceId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{service.name}</span>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground ml-4">
                              <Clock className="w-3 h-3" />
                              <span>{service.duration}min</span>
                              <DollarSign className="w-3 h-3" />
                              <span>R${service.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Horário */}
                <div>
                  <Label>Horário</Label>
                  <Select 
                    value={appointmentData.time} 
                    onValueChange={(value) => setAppointmentData(prev => ({ ...prev, time: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Resumo do Serviço */}
                {selectedService && (
                  <div className="bg-card p-4 rounded-lg border">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{selectedService.name}</span>
                        <Badge variant="secondary">
                          <Scissors className="w-3 h-3 mr-1" />
                          {selectedService.duration}min
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-semibold text-green-600">
                          R$ {selectedService.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Alguma observação especial sobre o atendimento..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            
            {step === "details" && (
              <Button 
                onClick={handleSaveAppointment}
                disabled={!appointmentData.barberId || !appointmentData.serviceId || !appointmentData.time}
                variant="hero"
              >
                {appointment ? "Salvar Alterações" : "Confirmar Agendamento"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};