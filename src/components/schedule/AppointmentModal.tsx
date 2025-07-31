import { useState, useEffect, useMemo } from "react";
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
  Search,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useBarberSelection } from "@/hooks/useBarberSelection";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";
import { useAppointments } from "@/hooks/useAppointments";
import { useProviderServices } from "@/hooks/useProviderServices";
import { useBarbershopSettings } from "@/hooks/useBarbershopSettings";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedTime?: string | null;
  selectedBarberId?: string;
  appointment?: any; // Para edição
  onAppointmentCreated?: () => void;
}

export const AppointmentModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  selectedTime,
  selectedBarberId,
  appointment,
  onAppointmentCreated
}: AppointmentModalProps) => {
  const [step, setStep] = useState<"client" | "details">("client");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [newClientData, setNewClientData] = useState({
    phone: "",
    name: "",
    email: "",
    birth_date: ""
  });
  const [loading, setLoading] = useState(false);
  const [phoneSearching, setPhoneSearching] = useState(false);
  const [existingClient, setExistingClient] = useState<any>(null);
  const [useExistingClient, setUseExistingClient] = useState(false);
  
  const { canManageAll } = useAuth();
  const { barbers } = useBarberSelection();
  const { clients, addClient, checkClientByPhone } = useClients();
  const { services } = useServices();
  const { createAppointment } = useAppointments();
  const { generateTimeSlots, isOpenOnDate } = useBarbershopSettings();
  
  // Debounce phone input para busca
  const debouncedPhone = useDebounce(newClientData.phone, 500);
  
  const [appointmentData, setAppointmentData] = useState({
    barberId: selectedBarberId || "",
    serviceId: "",
    time: selectedTime || "",
    notes: ""
  });

  // Update barber selection when prop changes
  useEffect(() => {
    if (selectedBarberId && !canManageAll) {
      setAppointmentData(prev => ({ ...prev, barberId: selectedBarberId }));
    }
  }, [selectedBarberId, canManageAll]);

  // Buscar cliente existente por telefone
  useEffect(() => {
    const searchClientByPhone = async () => {
      if (debouncedPhone && debouncedPhone.length >= 10) {
        setPhoneSearching(true);
        try {
          const client = await checkClientByPhone(debouncedPhone);
          if (client) {
            setExistingClient(client);
            setNewClientData(prev => ({ ...prev, name: client.name, email: client.email || "", birth_date: client.birth_date || "" }));
          } else {
            setExistingClient(null);
            setNewClientData(prev => ({ ...prev, name: "", email: "", birth_date: "" }));
          }
        } catch (error) {
          console.error('Error searching client:', error);
          setExistingClient(null);
        } finally {
          setPhoneSearching(false);
        }
      } else {
        setExistingClient(null);
        setNewClientData(prev => ({ ...prev, name: "", email: "", birth_date: "" }));
      }
    };

    searchClientByPhone();
  }, [debouncedPhone]); // Removido checkClientByPhone das dependências

  // Filtrar clientes por busca
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone.includes(clientSearch)
  );

  // Use real barbers from the hook
  const availableBarbers = barbers.map(b => ({
    id: b.id,
    name: b.full_name
  }));

  // Buscar serviços com preços do barbeiro selecionado
  const { getServicesWithPrices } = useProviderServices(appointmentData.barberId);
  const servicesWithPrices = getServicesWithPrices();
  
  // Se não há preços específicos do barbeiro, usar os serviços gerais
  const availableServices = servicesWithPrices.filter(s => s.is_active && s.price).length > 0 
    ? servicesWithPrices.filter(s => s.is_active && s.price)
    : services.filter(s => s.is_active);

  const selectedService = availableServices.find(s => s.id === appointmentData.serviceId);

  // Generate dynamic time slots based on barbershop settings and selected service
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const serviceDuration = selectedService ? parseInt(selectedService.duration_minutes?.toString() || '15') : 15;
    return generateTimeSlots(selectedDate, 15, serviceDuration);
  }, [selectedDate, selectedService, generateTimeSlots]);

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setStep("details");
  };

  const handleUseExistingClient = () => {
    if (existingClient) {
      setSelectedClient(existingClient);
      setStep("details");
    }
  };

  const handleNewClient = async () => {
    if (newClientData.name && newClientData.phone) {
      setLoading(true);
      const clientData = {
        ...newClientData,
        birth_date: newClientData.birth_date || undefined
      };
      const success = await addClient(clientData);
      if (success) {
        // Buscar o cliente recém-criado
        const newClient = clients.find(c => 
          c.name === newClientData.name && c.phone === newClientData.phone
        );
        if (newClient) {
          setSelectedClient(newClient);
          setStep("details");
        }
      }
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setNewClientData(prev => ({ ...prev, phone: formatted }));
  };

  const handleSaveAppointment = async () => {
    if (!selectedClient || !appointmentData.barberId || !appointmentData.serviceId || !appointmentData.time) {
      return;
    }

    const selectedService = availableServices.find(s => s.id === appointmentData.serviceId);
    if (!selectedService) return;

    setLoading(true);
    
    const appointmentDate = format(selectedDate, 'yyyy-MM-dd');
    const totalPrice = ('price' in selectedService ? selectedService.price : 0) || 0;
    
    console.log('💾 APPOINTMENT MODAL - SAVE APPOINTMENT:', {
      selectedDate: selectedDate.toISOString(),
      selectedDateLocal: selectedDate.toLocaleDateString('pt-BR'),
      selectedDateTime: selectedDate.toLocaleString('pt-BR'),
      appointmentDate,
      selectedClient: selectedClient.name,
      barberId: appointmentData.barberId,
      serviceId: appointmentData.serviceId,
      time: appointmentData.time,
      totalPrice
    });
    
    const success = await createAppointment({
      client_id: selectedClient.id,
      barber_id: appointmentData.barberId,
      service_id: appointmentData.serviceId,
      appointment_date: appointmentDate,
      start_time: appointmentData.time,
      total_price: totalPrice,
      notes: appointmentData.notes || undefined
    });

    if (success) {
      onAppointmentCreated?.();
      onClose();
      // Reset form
      setSelectedClient(null);
      setStep("client");
      setNewClientData({ phone: "", name: "", email: "", birth_date: "" });
      setExistingClient(null);
      setUseExistingClient(false);
      setAppointmentData({
        barberId: selectedBarberId || "",
        serviceId: "",
        time: selectedTime || "",
        notes: ""
      });
    }
    
    setLoading(false);
  };


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
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{clientSearch ? "Resultados da Busca" : "Clientes Recentes"}</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(clientSearch ? filteredClients : filteredClients.slice(0, 5)).map((client) => (
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
                    <Label htmlFor="phone">WhatsApp*</Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        value={newClientData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className={existingClient ? "border-yellow-300 bg-yellow-50" : ""}
                      />
                      {phoneSearching && (
                        <div className="absolute right-3 top-3">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {existingClient && !phoneSearching && (
                        <div className="absolute right-3 top-3">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        </div>
                      )}
                    </div>
                    
                    {existingClient && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-yellow-800">
                              Cliente já cadastrado: {existingClient.name}
                            </p>
                            <p className="text-xs text-yellow-600">
                              {existingClient.email && `Email: ${existingClient.email}`}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleUseExistingClient}
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Usar Cliente
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="name">Nome Completo*</Label>
                    <Input
                      id="name"
                      value={newClientData.name}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do cliente"
                      disabled={!!existingClient}
                      className={existingClient ? "bg-muted" : ""}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      disabled={!!existingClient}
                      className={existingClient ? "bg-muted" : ""}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="birth_date">Data de nascimento (opcional)</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={newClientData.birth_date}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, birth_date: e.target.value }))}
                      disabled={!!existingClient}
                      className={existingClient ? "bg-muted" : ""}
                    />
                  </div>
                </div>
                
                {!existingClient && (
                  <Button 
                    onClick={handleNewClient}
                    disabled={!newClientData.name || !newClientData.phone || loading}
                    className="w-full mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar e Continuar
                      </>
                    )}
                  </Button>
                )}
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

              {!isOpenOnDate(selectedDate) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ A barbearia está fechada neste dia. Verifique os horários de funcionamento.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profissional */}
                <div>
                  <Label>Profissional</Label>
                  <Select 
                    value={appointmentData.barberId} 
                    onValueChange={(value) => setAppointmentData(prev => ({ ...prev, barberId: value }))}
                    disabled={!canManageAll}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBarbers.map((barber) => (
                        <SelectItem key={barber.id} value={barber.id}>
                          {barber.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!canManageAll && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Agendamento será feito para você
                    </p>
                  )}
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
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{service.name}</span>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground ml-4">
                              <Clock className="w-3 h-3" />
                              <span>{service.duration_minutes}min</span>
                              {('price' in service && service.price) && (
                                <>
                                  <DollarSign className="w-3 h-3" />
                                  <span>R${service.price.toFixed(2)}</span>
                                </>
                              )}
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
                    disabled={!isOpenOnDate(selectedDate)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !isOpenOnDate(selectedDate) 
                          ? "Barbearia fechada neste dia" 
                          : timeSlots.length === 0
                          ? "Nenhum horário disponível"
                          : "Selecione o horário"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          Todos os horários já passaram
                        </div>
                      ) : (
                        timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      )}
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
                            {selectedService.duration_minutes}min
                          </Badge>
                        </div>
                        {('price' in selectedService && selectedService.price) && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-semibold text-green-600">
                              R$ {selectedService.price.toFixed(2)}
                            </span>
                          </div>
                        )}
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
                disabled={!appointmentData.barberId || !appointmentData.serviceId || !appointmentData.time || loading}
                variant="hero"
              >
                {loading ? "Salvando..." : (appointment ? "Salvar Alterações" : "Confirmar Agendamento")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};