import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, User, Clock, Scissors, X } from "lucide-react";
import { Appointment, Barber } from "@/types/appointment";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConflictGroup {
  appointments: Appointment[];
  timeRange: string;
}

interface ConflictReportProps {
  date: Date;
  barbers: Barber[];
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onClose: () => void;
}

export const ConflictReport = ({
  date,
  barbers,
  appointments,
  onAppointmentClick,
  onClose
}: ConflictReportProps) => {
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.substring(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
  };

  const getConflictsForBarber = (barberId: string): ConflictGroup[] => {
    const selectedDateStr = format(date, "yyyy-MM-dd");
    const barberAppointments = appointments.filter(apt => 
      apt.appointment_date === selectedDateStr && apt.barber_id === barberId
    );

    const overlaps: ConflictGroup[] = [];
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
        const allAppointments = [apt, ...conflicts];
        allAppointments.forEach(a => processedIds.add(a.id));
        
        const startTimes = allAppointments.map(a => timeToMinutes(a.start_time));
        const endTimes = allAppointments.map(a => timeToMinutes(a.end_time));
        const earliestStart = Math.min(...startTimes);
        const latestEnd = Math.max(...endTimes);
        
        const startTime = `${Math.floor(earliestStart / 60).toString().padStart(2, '0')}:${(earliestStart % 60).toString().padStart(2, '0')}`;
        const endTime = `${Math.floor(latestEnd / 60).toString().padStart(2, '0')}:${(latestEnd % 60).toString().padStart(2, '0')}`;
        
        overlaps.push({
          appointments: allAppointments.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)),
          timeRange: `${startTime} - ${endTime}`
        });
      }
    });

    return overlaps;
  };

  const getAllConflicts = () => {
    const allConflicts: Array<ConflictGroup & { barber: Barber }> = [];
    
    barbers.forEach(barber => {
      const conflicts = getConflictsForBarber(barber.id);
      conflicts.forEach(conflict => {
        allConflicts.push({ ...conflict, barber });
      });
    });

    return allConflicts;
  };

  const allConflicts = getAllConflicts();
  const filteredConflicts = selectedBarber 
    ? allConflicts.filter(c => c.barber.id === selectedBarber)
    : allConflicts;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'scheduled': return 'Agendado';
      case 'cancelled': return 'Cancelado';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  if (allConflicts.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-600" />
            <CardTitle>Relatório de Conflitos</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-green-600 text-lg font-semibold mb-2">
              ✅ Nenhum conflito encontrado
            </div>
            <p className="text-muted-foreground">
              Todos os agendamentos para {format(date, "dd 'de' MMMM", { locale: ptBR })} estão organizados corretamente.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <CardTitle>Relatório de Conflitos - {format(date, "dd 'de' MMMM", { locale: ptBR })}</CardTitle>
          <Badge variant="destructive">{allConflicts.length} conflito(s)</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Barber Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedBarber === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBarber(null)}
            >
              Todos os barbeiros
            </Button>
            {barbers.filter(b => getConflictsForBarber(b.id).length > 0).map(barber => (
              <Button
                key={barber.id}
                variant={selectedBarber === barber.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBarber(barber.id)}
              >
                {barber.full_name} ({getConflictsForBarber(barber.id).length})
              </Button>
            ))}
          </div>
        </div>

        {/* Conflicts List */}
        <div className="space-y-4">
          {filteredConflicts.map((conflict, conflictIndex) => (
            <Card key={conflictIndex} className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-red-600" />
                    <span className="font-semibold">{conflict.barber.full_name}</span>
                    <Badge variant="destructive">
                      {conflict.appointments.length} agendamentos sobrepostos
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {conflict.timeRange}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {conflict.appointments.map((appointment, aptIndex) => (
                    <div 
                      key={appointment.id}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => onAppointmentClick(appointment)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-900">
                          #{aptIndex + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.client?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Scissors className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {appointment.service?.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.start_time} - {appointment.end_time}</span>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-white ${getStatusColor(appointment.status)}`}
                        >
                          {getStatusText(appointment.status)}
                        </Badge>
                        <div className="text-sm font-medium">
                          R$ {appointment.total_price?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 mb-1">Ação recomendada:</p>
                      <p className="text-amber-700">
                        Reorganize os horários para evitar sobreposição. Considere alterar os horários 
                        ou redistribuir os agendamentos entre outros barbeiros disponíveis.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};