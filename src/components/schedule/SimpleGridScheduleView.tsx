import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Calendar, Plus, User, Clock, AlertTriangle } from "lucide-react";
import { LiveClock } from "@/components/ui/live-clock";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, Barber } from "@/types/appointment";
import { useBarbershopSettings } from "@/hooks/useBarbershopSettings";
import { ConflictReport } from "./ConflictReport";

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
  const [showConflictReport, setShowConflictReport] = useState(false);
  const { generateAllTimeSlots, isOpenOnDate, loading } = useBarbershopSettings();

  // Initialize selected barbers when barbers prop changes
  useEffect(() => {
    setSelectedBarbers(barbers);
  }, [barbers]);

  // Removed excessive debug logs for performance

  // Generate 5-minute time slots based on barbershop opening hours
  const timeSlots = useMemo(() => {
    if (loading || !isOpenOnDate(date)) return [];
    
    const slots = generateAllTimeSlots(date, 5); // 5 minute intervals
    return slots;
  }, [date, generateAllTimeSlots, isOpenOnDate, loading]);

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

  const getAppointmentsForSlot = (time: string, barberId: string) => {
    // Filter appointments for selected date first
    const selectedDateStr = format(date, "yyyy-MM-dd");
    const appointmentsForDate = appointments.filter(apt => apt.appointment_date === selectedDateStr);
    
    const appointmentsInSlot = appointmentsForDate.filter((apt) => {
      const aptStartMinutes = timeToMinutes(apt.start_time);
      const aptEndMinutes = timeToMinutes(apt.end_time);
      const slotMinutes = timeToMinutes(time);

      const isMatch = apt.barber_id === barberId && slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes;
      return isMatch;
    });

    return appointmentsInSlot;
  };

  const getAppointmentForSlot = (time: string, barberId: string) => {
    const appointmentsInSlot = getAppointmentsForSlot(time, barberId);
    return appointmentsInSlot[0]; // Return first appointment for backward compatibility
  };

  const getOverlappingAppointments = (barberId: string) => {
    const selectedDateStr = format(date, "yyyy-MM-dd");
    const barberAppointments = appointments.filter(apt => 
      apt.appointment_date === selectedDateStr && apt.barber_id === barberId
    );

    const overlaps: Array<{appointments: Appointment[], timeRange: string}> = [];
    
    barberAppointments.forEach(apt => {
      const conflicts = barberAppointments.filter(other => {
        if (other.id === apt.id) return false;
        
        const thisStart = timeToMinutes(apt.start_time);
        const thisEnd = timeToMinutes(apt.end_time);
        const otherStart = timeToMinutes(other.start_time);
        const otherEnd = timeToMinutes(other.end_time);
        
        return (thisStart < otherEnd && thisEnd > otherStart);
      });

      if (conflicts.length > 0) {
        const allAppointments = [apt, ...conflicts];
        const startTimes = allAppointments.map(a => timeToMinutes(a.start_time));
        const endTimes = allAppointments.map(a => timeToMinutes(a.end_time));
        const earliestStart = Math.min(...startTimes);
        const latestEnd = Math.max(...endTimes);
        
        const startTime = `${Math.floor(earliestStart / 60).toString().padStart(2, '0')}:${(earliestStart % 60).toString().padStart(2, '0')}`;
        const endTime = `${Math.floor(latestEnd / 60).toString().padStart(2, '0')}:${(latestEnd % 60).toString().padStart(2, '0')}`;
        
        // Check if this overlap group already exists
        const existingOverlap = overlaps.find(o => 
          o.appointments.some(a => allAppointments.find(b => b.id === a.id))
        );
        
        if (!existingOverlap) {
          overlaps.push({
            appointments: allAppointments,
            timeRange: `${startTime} - ${endTime}`
          });
        }
      }
    });

    return overlaps;
  };

  const getAppointmentHeight = (appointment: Appointment) => {
    const startMinutes = timeToMinutes(appointment.start_time);
    const endMinutes = timeToMinutes(appointment.end_time);
    const durationMinutes = endMinutes - startMinutes;
    const slots = durationMinutes / 5; // cada slot tem 5 minutos
    return slots * 16 - 2; // 16px por slot menos 2px de padding
  };

  const isAppointmentStart = (time: string, appointment: Appointment) => {
    return normalizeTime(appointment.start_time) === time;
  };

  const getBarberColor = (index: number) => {
    return barberColors[index % barberColors.length];
  };

  const visibleBarbers = selectedBarbers;

  // Check for conflicts
  const totalConflicts = useMemo(() => {
    const selectedDateStr = format(date, "yyyy-MM-dd");
    const appointmentsForDate = appointments.filter(apt => apt.appointment_date === selectedDateStr);
    
    let conflictCount = 0;
    barbers.forEach(barber => {
      const barberAppointments = appointmentsForDate.filter(apt => apt.barber_id === barber.id);
      const processedIds = new Set<string>();
      
      barberAppointments.forEach(apt => {
        if (processedIds.has(apt.id)) return;
        
        const conflicts = barberAppointments.filter(other => {
          if (other.id === apt.id || processedIds.has(other.id)) return false;
          
          const thisStart = timeToMinutes(apt.start_time);
          const thisEnd = timeToMinutes(apt.end_time);
          const otherStart = timeToMinutes(other.start_time);
          const otherEnd = timeToMinutes(other.end_time);
          
          return (thisStart < otherEnd && thisEnd > otherStart);
        });
        
        if (conflicts.length > 0) {
          conflictCount++;
          [apt, ...conflicts].forEach(a => processedIds.add(a.id));
        }
      });
    });
    
    return conflictCount;
  }, [date, appointments, barbers]);

  if (showConflictReport) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <ConflictReport
            date={date}
            barbers={barbers}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick || (() => {})}
            onClose={() => setShowConflictReport(false)}
          />
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando configurações da barbearia...</p>
          </div>
        </div>
      </div>
    );
  }

  // Closed barbershop state
  if (!isOpenOnDate(date)) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Barbearia fechada neste dia</p>
            <Button variant="outline" onClick={onGoToToday} className="mt-4">
              Voltar para hoje
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-foreground">Agenda</h1>
            <LiveClock />
          </div>

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

              {totalConflicts > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowConflictReport(true)}
                  className="mr-2"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {totalConflicts} Conflito(s)
                </Button>
              )}
              
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
                {timeSlots.map((time, index) => {
                  // Show time label only every 15 minutes (every 3rd slot for 5-min intervals)
                  const shouldShowLabel = index % 3 === 0;
                  const isHourMark = time.endsWith(':00');
                  
                  return (
                    <div 
                      key={time} 
                      className={`h-4 border-b flex items-center justify-start text-xs text-muted-foreground pl-2 ${
                        isHourMark ? 'border-b-2 border-border' : 'border-b border-border/30'
                      }`}
                    >
                      {shouldShowLabel && <span className={isHourMark ? 'font-medium' : ''}>{time}</span>}
                    </div>
                  );
                })}
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
                      const appointmentsInSlot = getAppointmentsForSlot(time, barber.id);
                      const primaryAppointment = appointmentsInSlot[0];
                      const hasOverlap = appointmentsInSlot.length > 1;
                      const isStart = primaryAppointment && isAppointmentStart(time, primaryAppointment);

                      return (
                        <div 
                          key={`${barber.id}-${time}`} 
                          className="h-4 border-b border-border/30 relative hover:bg-muted/50 cursor-pointer"
                          onClick={() => !primaryAppointment && onTimeSlotClick?.(barber.id, time)}
                        >
                          {isStart && (
                            <div className="relative">
                              {/* Primary appointment */}
                              <div
                                className={`bg-card border-l-4 ${hasOverlap ? 'border-l-red-500' : 'border-l-primary'} rounded-r shadow-sm absolute left-1 z-10 p-2 text-xs ${hasOverlap ? 'right-8' : 'right-1'}`}
                                style={{ height: `${getAppointmentHeight(primaryAppointment)}px` }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAppointmentClick?.(primaryAppointment);
                                }}
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-semibold text-primary">
                                    {primaryAppointment.start_time} - {primaryAppointment.end_time}
                                  </span>
                                  {hasOverlap && (
                                    <span className="bg-red-500 text-white text-xs px-1 rounded">!</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mb-1">
                                  <User className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-medium text-foreground truncate">
                                    {primaryAppointment.client?.name}
                                  </span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  ✂️ {primaryAppointment.service?.name}
                                </div>
                                <div className="mt-1">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    hasOverlap ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {primaryAppointment.status === 'scheduled' && 'Agendado'}
                                    {primaryAppointment.status === 'confirmed' && 'Confirmado'}
                                    {primaryAppointment.status === 'completed' && 'Concluído'}
                                    {primaryAppointment.status === 'cancelled' && 'Cancelado'}
                                  </span>
                                </div>
                                {hasOverlap && (
                                  <div className="mt-1 text-xs text-red-600 font-medium">
                                    +{appointmentsInSlot.length - 1} conflito(s)
                                  </div>
                                )}
                              </div>

                              {/* Overlapping appointments indicator */}
                              {hasOverlap && appointmentsInSlot.slice(1).map((overlappingApt, index) => {
                                const overlapIsStart = isAppointmentStart(time, overlappingApt);
                                if (!overlapIsStart) return null;
                                
                                return (
                                  <div
                                    key={overlappingApt.id}
                                    className="bg-red-100 border-l-4 border-l-red-500 rounded-r shadow-sm absolute z-20 p-1 text-xs cursor-pointer hover:bg-red-200"
                                    style={{ 
                                      height: `${getAppointmentHeight(overlappingApt)}px`,
                                      right: `${1 + (index * 7)}px`,
                                      width: '6px',
                                      writingMode: 'vertical-rl',
                                      textOrientation: 'mixed'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onAppointmentClick?.(overlappingApt);
                                    }}
                                    title={`${overlappingApt.client?.name} - ${overlappingApt.service?.name} (${overlappingApt.start_time} - ${overlappingApt.end_time})`}
                                  >
                                    <span className="text-red-700 font-bold">!</span>
                                  </div>
                                );
                              })}
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