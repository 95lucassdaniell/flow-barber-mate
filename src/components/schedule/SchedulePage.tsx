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
import { AppointmentModal } from "./AppointmentModal";
import { BarberSelector } from "./BarberSelector";

const SchedulePage = () => {
  const { profile, loading: authLoading } = useAuth();
  const { selectedBarberId, selectedBarber, loading: barberLoading } = useBarberSelection();
  const { appointments, loading, fetchAppointments } = useAppointments();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Fetch appointments for selected barber and date
  useEffect(() => {
    if (selectedBarberId && selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      fetchAppointments(selectedBarberId, dateString);
    }
  }, [selectedBarberId, selectedDate]);

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

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

  const getAppointmentForTimeSlot = (timeSlot: string) => {
    return appointments.find(apt => apt.start_time.slice(0, 5) === timeSlot);
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

  const renderDayView = () => (
    <div className="space-y-3">
      {timeSlots.map((timeSlot) => {
        const appointment = getAppointmentForTimeSlot(timeSlot);
        
        return (
          <div 
            key={timeSlot}
            className={`flex items-center p-3 rounded-lg border transition-colors cursor-pointer ${
              appointment 
                ? "bg-card hover:bg-card/80" 
                : "bg-gray-50 hover:bg-gray-100 border-dashed"
            }`}
            onClick={() => handleTimeSlotClick(timeSlot)}
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex items-center space-x-2 w-20">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{timeSlot}</span>
              </div>
              
              <div className="flex-1">
                {appointment ? (
                  <>
                    <div className="flex items-center justify-between">
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
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground italic">Horário disponível</p>
                    <Button variant="ghost" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="space-y-2">
            <div className={`text-center p-2 rounded-lg ${
              isSameDay(day, selectedDate) 
                ? "bg-accent text-accent-foreground" 
                : "bg-card"
            }`}>
              <p className="text-xs text-muted-foreground">
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <p className="font-medium">{format(day, "d")}</p>
            </div>
            
            <div className="space-y-1">
              {timeSlots.slice(0, 6).map((timeSlot) => {
                const appointment = getAppointmentForTimeSlot(timeSlot);
                return (
                  <div 
                    key={`${day.toISOString()}-${timeSlot}`}
                    className={`text-xs p-1 rounded cursor-pointer ${
                      appointment 
                        ? "bg-accent text-accent-foreground" 
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => handleTimeSlotClick(timeSlot)}
                  >
                    {appointment ? appointment.client?.name || 'Cliente' : timeSlot}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
              const dateString = format(selectedDate, 'yyyy-MM-dd');
              fetchAppointments(selectedBarberId, dateString);
            }
          }}
        />
      )}
    </div>
  );
};

export default SchedulePage;