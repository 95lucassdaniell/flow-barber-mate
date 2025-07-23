import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Scissors, 
  MessageCircle, 
  Calendar, 
  Star, 
  Gift,
  Phone,
  Mail,
  Clock
} from "lucide-react";

interface ClientTimelineProps {
  clientId: string;
}

const ClientTimeline = ({ clientId }: ClientTimelineProps) => {
  // Mock data para demonstração - em produção, viria de uma query específica
  const timelineEvents = [
    {
      id: 1,
      type: "appointment",
      title: "Agendamento realizado",
      description: "Corte masculino + Barba com João Silva",
      timestamp: "2024-01-15T10:30:00",
      value: 65,
      rating: 5,
      notes: "Cliente muito satisfeito com o resultado"
    },
    {
      id: 2,
      type: "message",
      title: "Mensagem WhatsApp enviada",
      description: "Lembrete de agendamento para próxima semana",
      timestamp: "2024-01-18T14:20:00",
      status: "delivered"
    },
    {
      id: 3,
      type: "call",
      title: "Ligação telefônica",
      description: "Reagendamento solicitado pelo cliente",
      timestamp: "2024-01-20T16:45:00",
      duration: "3 min"
    },
    {
      id: 4,
      type: "appointment",
      title: "Agendamento realizado",
      description: "Corte masculino com Maria Santos",
      timestamp: "2023-12-22T09:15:00",
      value: 45,
      rating: 4,
      notes: "Primeira vez com barbeira diferente"
    },
    {
      id: 5,
      type: "message",
      title: "Mensagem WhatsApp recebida",
      description: '"Muito obrigado pelo ótimo atendimento!"',
      timestamp: "2023-12-22T11:30:00",
      status: "received"
    },
    {
      id: 6,
      type: "birthday",
      title: "Parabéns enviado",
      description: "Mensagem de aniversário + cupom desconto 15%",
      timestamp: "2023-11-25T08:00:00",
      discount: 15
    },
    {
      id: 7,
      type: "appointment",
      title: "Agendamento realizado",
      description: "Corte masculino + Lavagem com João Silva",
      timestamp: "2023-11-18T14:00:00",
      value: 55,
      rating: 5,
      notes: "Cliente pontual, sempre satisfeito"
    },
    {
      id: 8,
      type: "registration",
      title: "Cliente cadastrado",
      description: "Primeiro atendimento na barbearia",
      timestamp: "2023-09-10T11:30:00",
      channel: "Indicação de amigo"
    }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Scissors className="h-4 w-4" />;
      case "message":
        return <MessageCircle className="h-4 w-4" />;
      case "call":
        return <Phone className="h-4 w-4" />;
      case "birthday":
        return <Gift className="h-4 w-4" />;
      case "registration":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "appointment":
        return "bg-green-100 text-green-800 border-green-200";
      case "message":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "call":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "birthday":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "registration":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Timeline de Interações</h3>
      
      <div className="relative">
        {/* Linha vertical da timeline */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-4">
          {timelineEvents.map((event, index) => {
            const { date, time } = formatDate(event.timestamp);
            
            return (
              <div key={event.id} className="relative flex items-start space-x-4">
                {/* Ícone do evento */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${getEventColor(event.type)}`}>
                  {getEventIcon(event.type)}
                </div>
                
                {/* Conteúdo do evento */}
                <div className="flex-1 min-w-0">
                  <Card className="border-l-4 border-l-current" style={{ borderLeftColor: getEventColor(event.type).includes('green') ? '#10b981' : 
                    getEventColor(event.type).includes('blue') ? '#3b82f6' :
                    getEventColor(event.type).includes('purple') ? '#8b5cf6' :
                    getEventColor(event.type).includes('pink') ? '#ec4899' :
                    getEventColor(event.type).includes('yellow') ? '#f59e0b' : '#6b7280' }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{event.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {time}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.description}
                          </p>
                          
                          {/* Informações específicas por tipo */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            {event.value && (
                              <span className="font-medium text-green-600">
                                R$ {event.value}
                              </span>
                            )}
                            
                            {event.rating && (
                              <div className="flex items-center space-x-1">
                                <span>Avaliação:</span>
                                {renderStarRating(event.rating)}
                              </div>
                            )}
                            
                            {event.status && (
                              <Badge variant="secondary" className="text-xs">
                                {event.status === "delivered" ? "Entregue" : 
                                 event.status === "received" ? "Recebida" : event.status}
                              </Badge>
                            )}
                            
                            {event.duration && (
                              <span>Duração: {event.duration}</span>
                            )}
                            
                            {event.discount && (
                              <span className="text-green-600 font-medium">
                                Desconto: {event.discount}%
                              </span>
                            )}
                            
                            {event.channel && (
                              <span>Via: {event.channel}</span>
                            )}
                          </div>
                          
                          {event.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <strong>Observação:</strong> {event.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right text-xs text-muted-foreground">
                          {date}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Estatísticas da timeline */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">Resumo de Interações</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {timelineEvents.filter(e => e.type === "appointment").length}
              </div>
              <p className="text-muted-foreground">Agendamentos</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {timelineEvents.filter(e => e.type === "message").length}
              </div>
              <p className="text-muted-foreground">Mensagens</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {timelineEvents.filter(e => e.type === "call").length}
              </div>
              <p className="text-muted-foreground">Ligações</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                R$ {timelineEvents
                  .filter(e => e.value)
                  .reduce((sum, e) => sum + (e.value || 0), 0)}
              </div>
              <p className="text-muted-foreground">Total Gasto</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientTimeline;