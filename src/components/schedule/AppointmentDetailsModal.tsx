import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Clock, User, Scissors, Phone, DollarSign, Edit, Trash2, Check, X, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppointments } from "@/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  client_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  
  client?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  service?: {
    id: string;
    name: string;
    duration_minutes: number;
  };
  barber?: {
    id: string;
    full_name: string;
  };
}

interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (appointment: Appointment) => void;
  onRefresh?: () => void;
}

export const AppointmentDetailsModal = ({ 
  appointment, 
  isOpen, 
  onClose, 
  onEdit,
  onRefresh 
}: AppointmentDetailsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { updateAppointment, cancelAppointment, deleteAppointment } = useAppointments();

  if (!appointment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 border-green-500/20 text-green-700';
      case 'scheduled':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700';
      case 'cancelled':
        return 'bg-red-500/10 border-red-500/20 text-red-700';
      case 'completed':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-700';
      default:
        return 'bg-muted border-border text-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'scheduled':
        return 'Agendado';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsLoading(true);
    try {
      // Use internal API for status update since it's not part of CreateAppointmentData
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointment.id);
      
      if (error) throw error;
      toast({
        title: "Status atualizado",
        description: `Agendamento marcado como ${getStatusText(newStatus).toLowerCase()}`,
      });
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar o status do agendamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await cancelAppointment(appointment.id);
      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado com sucesso",
      });
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar o agendamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteAppointment(appointment.id);
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído permanentemente",
      });
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir o agendamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Detalhes do Agendamento
            <Badge className={getStatusColor(appointment.status)}>
              {getStatusText(appointment.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data e Horário */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Data</span>
            </div>
            <p className="text-sm ml-6">{formatDate(appointment.appointment_date)}</p>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Horário</span>
            </div>
            <p className="text-sm ml-6">{appointment.start_time} - {appointment.end_time}</p>
          </div>

          <Separator />

          {/* Cliente */}
          {appointment.client && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Cliente</span>
              </div>
              <p className="text-sm ml-6 font-semibold">{appointment.client.name}</p>
              {appointment.client.phone && (
                <div className="flex items-center gap-2 ml-6">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{appointment.client.phone}</span>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Serviço */}
          {appointment.service && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Serviço</span>
              </div>
              <p className="text-sm ml-6">{appointment.service.name}</p>
              <p className="text-xs ml-6 text-muted-foreground">
                Duração: {appointment.service.duration_minutes} minutos
              </p>
            </div>
          )}

          <Separator />

          {/* Barbeiro */}
          {appointment.barber && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Barbeiro</span>
              </div>
              <p className="text-sm ml-6">{appointment.barber.full_name}</p>
            </div>
          )}

          <Separator />

          {/* Preço */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Valor</span>
            </div>
            <p className="text-sm ml-6 font-bold">R$ {appointment.total_price.toFixed(2)}</p>
          </div>

          {/* Observações */}
          {appointment.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium">Observações</span>
                <p className="text-xs text-muted-foreground">{appointment.notes}</p>
              </div>
            </>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2 pt-4">
          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <div className="flex gap-2">
              {appointment.status === 'scheduled' && (
                <Button 
                  onClick={() => handleStatusUpdate('confirmed')} 
                  disabled={isLoading}
                  className="flex-1"
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
              )}
              
              {appointment.status === 'confirmed' && (
                <Button 
                  onClick={() => handleStatusUpdate('completed')} 
                  disabled={isLoading}
                  className="flex-1"
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Concluir
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {onEdit && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
              <Button 
                variant="outline" 
                onClick={() => onEdit(appointment)}
                disabled={isLoading}
                className="flex-1"
                size="sm"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}

            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={isLoading}
                    className="flex-1"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar este agendamento? Esta ação pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>
                      Cancelar Agendamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {appointment.status === 'cancelled' && (
            <Button 
              onClick={() => handleStatusUpdate('scheduled')} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reativar
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={isLoading}
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir Permanentemente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este agendamento permanentemente? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Excluir Permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};