import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Calendar, Plus, User, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, Barber } from "@/types/appointment";

interface SimpleGridScheduleViewProps {
  date: Date;
  barbers: Barber[];
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (barberId: string, timeSlot: string) => void;
  onNavigateDate?: (direction: "prev" | "next") => void;
  onGoToToday?: () => void;
  onNewAppointment?: () => void;
}

export const SimpleGridScheduleView = ({
  date,
  barbers,
  appointments,
  onAppointmentClick,
  onTimeSlotClick,
  onNavigateDate,
  onGoToToday,
  onNewAppointment
}: SimpleGridScheduleViewProps) => {
  const [selectedBarbers, setSelectedBarbers] = useState<Barber[]>([]);

  // Initialize selected barbers when barbers prop changes
  useEffect(() => {
    setSelectedBarbers(barbers);
  }, [barbers]);

  // Debug logs
  useEffect(() => {
    console.log("🗓️ Data selecionada:", format(date, "yyyy-MM-dd"));
    console.log("📅 Total appointments recebidos:", appointments.length);
    console.log("📅 Appointments para debug:", appointments);
    
    // Filter appointments for selected date
    const selectedDateStr = format(date, "yyyy-MM-dd");
    const appointmentsForDate = appointments.filter(apt => apt.appointment_date === selectedDateStr);
    console.log("📅 Appointments para a data selecionada:", appointmentsForDate.length, appointmentsForDate);
  }, [date, appointments]);

  // Generate 15-minute time slots from 8:00 to 18:45
  const timeSlots = [
    "08:00", "08:15", "08:30", "08:45",
    "09:00", "09:15", "09:30", "09:45", 
    "10:00", "10:15", "10:30", "10:45",
    "11:00", "11:15", "11:30", "11:45",
    "12:00", "12:15", "12:30", "12:45",
    "13:00", "13:15", "13:30", "13:45",
    "14:00", "14:15", "14:30", "14:45",
    "15:00", "15:15", "15:30", "15:45",
    "16:00", "16:15", "16:30", "16:45",
    "17:00", "17:15", "17:30", "17:45",
    "18:00", "18:15", "18:30", "18:45"
  ];

  // Barber colors using semantic design tokens
  const barberColors = [
    "bg-primary", "bg-green-600", "bg-purple-600", "bg-orange-600",
    "bg-red-600", "bg-pink-600", "bg-indigo-600", "bg-accent"
  ];

  const formatDate = (date: Date) => {
    const days = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    const months = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, "0");
    const month = months[date.getMonth()];
    return `${dayName}, ${day} de ${month}`;
  };

  const dayName = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][date.getDay()];

  const toggleBarber = (barber: Barber) => {
    const isSelected = selectedBarbers.find(b => b.id === barber.id);
    if (isSelected) {
      setSelectedBarbers(selectedBarbers.filter(b => b.id !== barber.id));
    } else {
      setSelectedBarbers([...selectedBarbers, barber]);
    }
  };

  const toggleAllBarbers = (checked: boolean) => {
    setSelectedBarbers(checked ? barbers : []);
  };

  // Normalize time format (remove seconds if present)
  const normalizeTime = (time: string) => {
    return time.substring(0, 5); // Gets HH:MM format
  };

  const timeToMinutes = (time: string) => {
    const normalizedTime = normalizeTime(time);
    const [hours, minutes] = normalizedTime.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const getAppointmentForSlot = (time: string, barberId: string) => {
    // Filter appointments for selected date first
    const selectedDateStr = format(date, "yyyy-MM-dd");
    const appointmentsForDate = appointments.filter(apt => apt.appointment_date === selectedDateStr);
    
    const appointment = appointmentsForDate.find((apt) => {
      const aptStartMinutes = timeToMinutes(apt.start_time);
      const aptEndMinutes = timeToMinutes(apt.end_time);
      const slotMinutes = timeToMinutes(time);

      const isMatch = apt.barber_id === barberId && slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes;
      
      // Debug log for first few slots
      if (time === "08:00" || time === "09:00" || time === "10:00") {
        console.log(`🔍 Checking slot ${time} for barber ${barberId}:`, {
          aptStartTime: apt.start_time,
          aptEndTime: apt.end_time,
          aptStartMinutes,
          aptEndMinutes,
          slotMinutes,
          barberMatch: apt.barber_id === barberId,
          timeMatch: slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes,
          isMatch
        });
      }
      
      return isMatch;
    });

    return appointment;
  };

  const getAppointmentHeight = (appointment: Appointment) => {
    const startMinutes = timeToMinutes(appointment.start_time);
    const endMinutes = timeToMinutes(appointment.end_time);
    const durationMinutes = endMinutes - startMinutes;
    const slots = durationMinutes / 15; // cada slot tem 15 minutos
    return slots * 48 - 4; // 48px por slot menos 4px de padding
  };

  const isAppointmentStart = (time: string, appointment: Appointment) => {
    return normalizeTime(appointment.start_time) === time;
  };

  const getBarberColor = (index: number) => {
    return barberColors[index % barberColors.length];
  };

  const visibleBarbers = selectedBarbers;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-6">Agenda</h1>

          {/* Navigation Bar */}
          <div className="flex items-center justify-between bg-card rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg font-medium">Agenda - {formatDate(date)}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => onNavigateDate?.("prev")}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {dayName}, {date.getDate().toString().padStart(2, "0")}/
                    {(date.getMonth() + 1).toString().padStart(2, "0")}/{date.getFullYear()}
                  </span>
                </div>

                <Button variant="outline" size="icon" onClick={() => onNavigateDate?.("next")}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="outline" onClick={onGoToToday}>
                Hoje
              </Button>

              <Button onClick={onNewAppointment}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Agendamento
              </Button>
            </div>
          </div>
        </div>

        {/* Barbers Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Barbeiros</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleAllBarbers(true)}>
                  Todos
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAllBarbers(false)}>
                  Nenhum
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              {barbers.map((barber, index) => (
                <div key={barber.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={barber.id} 
                    checked={selectedBarbers.find(b => b.id === barber.id) !== undefined}
                    onCheckedChange={() => toggleBarber(barber)} 
                  />
                  <div className={`w-3 h-3 rounded-full ${getBarberColor(index)}`} />
                  <label
                    htmlFor={barber.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {barber.full_name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule Grid */}
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-[100px_1fr] min-h-[600px]">
              {/* Time Column */}
              <div className="border-r bg-muted">
                <div className="h-16 border-b flex items-center justify-center font-medium text-muted-foreground">Horário</div>
                {timeSlots.map((time) => (
                  <div key={time} className="h-12 border-b flex items-center justify-center text-sm text-muted-foreground">
                    {time}
                  </div>
                ))}
              </div>

              {/* Barbers Columns */}
              <div 
                className="grid"
                style={{ gridTemplateColumns: `repeat(${visibleBarbers.length}, 1fr)` }}
              >
                {visibleBarbers.map((barber, index) => (
                  <div key={barber.id} className="border-r last:border-r-0">
                    {/* Barber Header */}
                    <div
                      className={`h-16 border-b flex items-center justify-center text-white font-medium ${getBarberColor(index)}`}
                    >
                      {barber.full_name}
                    </div>

                    {/* Time Slots */}
                    {timeSlots.map((time) => {
                      const appointment = getAppointmentForSlot(time, barber.id);
                      const isStart = appointment && isAppointmentStart(time, appointment);

                      return (
                        <div 
                          key={`${barber.id}-${time}`} 
                          className="h-12 border-b p-1 relative hover:bg-muted/50 cursor-pointer"
                          onClick={() => !appointment && onTimeSlotClick?.(barber.id, time)}
                        >
                          {isStart && (
                            <div
                              className="bg-card border-l-4 border-l-primary rounded-r shadow-sm absolute left-1 right-1 z-10 p-2 text-xs"
                              style={{ height: `${getAppointmentHeight(appointment)}px` }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onAppointmentClick?.(appointment);
                              }}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="font-semibold text-primary">
                                  {appointment.start_time} - {appointment.end_time}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium text-foreground truncate">
                                  {appointment.client?.name}
                                </span>
                              </div>
                              <div className="text-muted-foreground text-xs">
                                ✂️ {appointment.service?.name}
                              </div>
                              <div className="mt-1">
                                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {appointment.status === 'scheduled' && 'Agendado'}
                                  {appointment.status === 'confirmed' && 'Confirmado'}
                                  {appointment.status === 'completed' && 'Concluído'}
                                  {appointment.status === 'cancelled' && 'Cancelado'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};