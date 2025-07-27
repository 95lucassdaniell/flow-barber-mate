import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useBarberSelection } from "@/hooks/useBarberSelection";
import { useAppointments } from "@/hooks/useAppointments";
import { useBarbershopSettings } from "@/hooks/useBarbershopSettings";
import { AppointmentModal } from "./AppointmentModal";
import { BarberSelector } from "./BarberSelector";

const SchedulePage = () => {
  const { profile, loading: authLoading } = useAuth();
  const { selectedBarberId, selectedBarber, loading: barberLoading } = useBarberSelection();
  const { appointments, loading, fetchAppointments } = useAppointments();
  const { 
    generateTimeSlots, 
    generateAllTimeSlots,
    isOpenOnDate, 
    getOpeningHoursForDate,
    isTimeSlotInPast,
    isTimeSlotAvailable 
  } = useBarbershopSettings();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Fetch appointments for selected barber and date/week
  useEffect(() => {
    if (selectedBarberId && selectedDate) {
      if (viewMode === "week") {
        // Fetch appointments for the entire week
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        
        // Fetch for each day of the week
        for (let i = 0; i < 7; i++) {
          const currentDay = addDays(weekStart, i);
          const dateString = format(currentDay, 'yyyy-MM-dd');
          fetchAppointments(selectedBarberId, dateString);
        }
      } else {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        fetchAppointments(selectedBarberId, dateString);
      }
    }
  }, [selectedBarberId, selectedDate, viewMode]);

  // Generate all time slots for display
  const timeSlots = generateAllTimeSlots(selectedDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmado";
      case "pending": return "Pendente";
      case "completed": return "Concluído";
      case "cancelled": return "Cancelado";
      default: return status;
    }
  };

  const getAppointmentForTimeSlot = (timeSlot: string, date?: Date) => {
    if (!date) {
      return appointments.find(apt => apt.start_time.slice(0, 5) === timeSlot);
    }
    
    const dateString = format(date, 'yyyy-MM-dd');
    return appointments.find(apt => 
      apt.start_time.slice(0, 5) === timeSlot && 
      apt.appointment_date === dateString
    );
  };

  if (authLoading || barberLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-32 mb-2" />
          <div className="h-4 bg-muted rounded w-64" />
        </div>
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
          <div className="lg:col-span-3 h-96 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const handleTimeSlotClick = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    setShowAppointmentModal(true);
  };

  const renderDayView = () => {
    const isBarbershopOpen = isOpenOnDate(selectedDate);
    
    // Se não há horários definidos, usar horários padrão para visualização
    const displaySlots = timeSlots.length > 0 ? timeSlots : 
      ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
       '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
       '17:00', '17:30'];

    return (
      <div className="space-y-3">
        {displaySlots.map((timeSlot) => {
          const appointment = getAppointmentForTimeSlot(timeSlot);
          const isAvailable = isBarbershopOpen && isTimeSlotAvailable(selectedDate, timeSlot);
          const isPast = isTimeSlotInPast(selectedDate, timeSlot);
          
          // Determinar o estado do slot
          let slotState: 'available' | 'occupied' | 'past' | 'closed' = 'available';
          let slotLabel = 'Horário disponível';
          let canClick = false;
          
          if (appointment) {
            slotState = 'occupied';
            canClick = true; // Pode clicar para editar
          } else if (!isBarbershopOpen) {
            slotState = 'closed';
            slotLabel = 'Fechado';
          } else if (isPast) {
            slotState = 'past';
            slotLabel = 'Horário passado';
          } else if (isAvailable) {
            slotState = 'available';
            slotLabel = 'Horário disponível';
            canClick = true;
          }
        
          return (
            <div 
              key={timeSlot}
              className={`flex items-center p-3 rounded-lg border transition-colors ${
                slotState === 'occupied' 
                  ? "bg-card hover:bg-card/80 cursor-pointer" 
                  : slotState === 'available'
                  ? "bg-gray-50 hover:bg-gray-100 border-dashed cursor-pointer"
                  : slotState === 'past'
                  ? "bg-muted/30 border-muted cursor-not-allowed opacity-60"
                  : "bg-destructive/10 border-destructive/20 cursor-not-allowed opacity-60"
              }`}
              onClick={() => {
                if (canClick) {
                  if (appointment) {
                    // TODO: Implementar edição de agendamento
                    console.log('Editar agendamento:', appointment);
                  } else {
                    handleTimeSlotClick(timeSlot);
                  }
                }
              }}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex items-center space-x-2 w-20">
                  <Clock className={`w-4 h-4 ${
                    slotState === 'past' || slotState === 'closed' 
                      ? 'text-muted-foreground/50' 
                      : 'text-muted-foreground'
                  }`} />
                  <span className={`text-sm font-medium ${
                    slotState === 'past' || slotState === 'closed' 
                      ? 'text-muted-foreground' 
                      : ''
                  }`}>{timeSlot}</span>
                </div>
                
                <div className="flex-1">
                  {appointment ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{appointment.client?.name || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.service?.name || 'Serviço'} • {appointment.barber?.full_name || 'Barbeiro'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.client?.phone || ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            R$ {Number(appointment.total_price).toFixed(2)}
                          </p>
                          <Badge variant="secondary" className={getStatusColor(appointment.status)}>
                            {getStatusText(appointment.status)}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Botões de ação */}
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Abrir comanda do agendamento
                            console.log('Realizado/Comanda para agendamento:', appointment.id);
                          }}
                        >
                          Realizado/Comanda
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Marcar como ausência
                            console.log('Ausência para agendamento:', appointment.id);
                          }}
                        >
                          Ausência
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Cancelar agendamento
                            console.log('Cancelar agendamento:', appointment.id);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Adicionar serviço
                            console.log('Adicionar serviço ao agendamento:', appointment.id);
                          }}
                        >
                          + Serviço
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Adicionar produto
                            console.log('Adicionar produto ao agendamento:', appointment.id);
                          }}
                        >
                          + Produto
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className={`italic ${
                        slotState === 'past' || slotState === 'closed' 
                          ? 'text-muted-foreground' 
                          : 'text-muted-foreground'
                      }`}>{slotLabel}</p>
                      {slotState === 'available' && (
                        <Button variant="ghost" size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayTimeSlots = generateAllTimeSlots(day);
          const isOpen = isOpenOnDate(day);
          
          return (
            <div key={day.toISOString()} className="space-y-2">
              <div 
                className={`text-center p-2 rounded-lg cursor-pointer transition-colors ${
                  isSameDay(day, selectedDate) 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-card hover:bg-card/80"
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <p className="text-xs text-muted-foreground">
                  {format(day, "EEE", { locale: ptBR })}
                </p>
                <p className="font-medium">{format(day, "d")}</p>
                {!isOpen && (
                  <p className="text-xs text-red-500">Fechado</p>
                )}
              </div>
              
              <div className="space-y-1">
                {!isOpen ? (
                  <div className="text-xs text-center text-muted-foreground p-2">
                    Fechado
                  </div>
                ) : (
                  dayTimeSlots.slice(0, 6).map((timeSlot) => {
                    const appointment = getAppointmentForTimeSlot(timeSlot, day);
                    return (
                      <div 
                        key={`${day.toISOString()}-${timeSlot}`}
                        className={`text-xs p-1 rounded cursor-pointer transition-colors ${
                          appointment 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                        }`}
                        onClick={() => {
                          setSelectedDate(day);
                          handleTimeSlotClick(timeSlot);
                        }}
                        title={appointment ? `${appointment.client?.name} - ${appointment.service?.name}` : `Agendar às ${timeSlot}`}
                      >
                        {appointment ? (
                          <div className="truncate">
                            <div className="font-medium">{timeSlot}</div>
                            <div className="truncate">{appointment.client?.name}</div>
                          </div>
                        ) : (
                          <div className="text-center">{timeSlot}</div>
                        )}
                      </div>
                    );
                  })
                )}
                
                {/* Show count of remaining appointments if there are more than 6 */}
                {isOpen && dayTimeSlots.length > 6 && (
                  <div className="text-xs text-center text-muted-foreground p-1">
                    +{dayTimeSlots.length - 6} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <BarberSelector />
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("day")}
            >
              Dia
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Semana
            </Button>
            <Button
              variant="hero"
              onClick={() => setShowAppointmentModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendário */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Calendário</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Agenda Principal */}
        <Card className="lg:col-span-3 shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>
                  {viewMode === "day" 
                    ? `Agenda ${selectedBarber ? `- ${selectedBarber.full_name}` : ''}` 
                    : "Visão Semanal"
                  }
                </span>
              </CardTitle>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
           <CardContent>
             {loading ? (
               <div className="space-y-3">
                 {Array.from({ length: 8 }).map((_, i) => (
                   <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                 ))}
               </div>
             ) : (
               viewMode === "day" ? renderDayView() : renderWeekView()
             )}
           </CardContent>
        </Card>
      </div>

      {/* Modal de Agendamento */}
      {showAppointmentModal && (
        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedTimeSlot(null);
          }}
          selectedDate={selectedDate}
          selectedTime={selectedTimeSlot}
          selectedBarberId={selectedBarberId}
          onAppointmentCreated={() => {
            if (selectedBarberId && selectedDate) {
              if (viewMode === "week") {
                // Refetch entire week
                const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
                for (let i = 0; i < 7; i++) {
                  const currentDay = addDays(weekStart, i);
                  const dateString = format(currentDay, 'yyyy-MM-dd');
                  fetchAppointments(selectedBarberId, dateString);
                }
              } else {
                const dateString = format(selectedDate, 'yyyy-MM-dd');
                fetchAppointments(selectedBarberId, dateString);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default SchedulePage;