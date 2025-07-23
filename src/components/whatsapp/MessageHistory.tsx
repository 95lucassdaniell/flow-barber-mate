import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MessageHistory {
  id: string;
  recipient: string;
  message: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  type: 'manual' | 'automatic';
  template?: string;
}

const MessageHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Mock data
  const [messages] = useState<MessageHistory[]>([
    {
      id: '1',
      recipient: 'João Silva (+55 11 99999-1111)',
      message: 'Olá João! Seu agendamento foi confirmado para amanhã às 14:00 com Carlos.',
      status: 'read',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: 'automatic',
      template: 'Confirmação de Agendamento'
    },
    {
      id: '2',
      recipient: 'Maria Santos (+55 11 88888-2222)',
      message: 'Oi Maria! Lembrete: você tem agendamento hoje às 16:00 com Pedro. Te esperamos!',
      status: 'delivered',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      type: 'automatic',
      template: 'Lembrete 1h Antes'
    },
    {
      id: '3',
      recipient: 'Carlos Oliveira (+55 11 77777-3333)',
      message: 'Obrigado pela preferência! Esperamos vê-lo novamente em breve.',
      status: 'sent',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      type: 'manual'
    },
    {
      id: '4',
      recipient: 'Ana Costa (+55 11 66666-4444)',
      message: 'Oi Ana! Você tem agendamento amanhã às 10:00. Confirma sua presença? Responda SIM ou NÃO.',
      status: 'read',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      type: 'automatic',
      template: 'Solicitar Confirmação'
    },
    {
      id: '5',
      recipient: 'Roberto Lima (+55 11 55555-5555)',
      message: 'Olá! Temos uma promoção especial hoje: 20% de desconto em todos os serviços. Aproveite!',
      status: 'failed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      type: 'manual'
    }
  ]);

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    const matchesType = typeFilter === "all" || message.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: MessageHistory['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-600 fill-current" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: MessageHistory['status']) => {
    switch (status) {
      case 'sent':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'read':
        return 'Lido';
      case 'failed':
        return 'Falhou';
      default:
        return 'Pendente';
    }
  };

  const getStatusColor = (status: MessageHistory['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'read':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: MessageHistory['type']) => {
    return type === 'automatic' ? 'Automática' : 'Manual';
  };

  const stats = {
    total: messages.length,
    sent: messages.filter(m => m.status === 'sent').length,
    delivered: messages.filter(m => m.status === 'delivered').length,
    read: messages.filter(m => m.status === 'read').length,
    failed: messages.filter(m => m.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Histórico de Mensagens</h2>
        <p className="text-muted-foreground">
          Acompanhe todas as mensagens enviadas via WhatsApp
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-muted-foreground">Enviadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-muted-foreground">Entregues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-700">{stats.read}</div>
            <div className="text-sm text-muted-foreground">Lidas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Falharam</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por destinatário ou mensagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="read">Lido</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="automatic">Automática</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma mensagem encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                  ? "Nenhuma mensagem corresponde aos filtros aplicados."
                  : "Ainda não há mensagens no histórico."
                }
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium">
                        {message.recipient}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate">{message.message}</p>
                          {message.template && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {message.template}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(message.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(message.status)}
                          <Badge className={getStatusColor(message.status)}>
                            {getStatusLabel(message.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(message.timestamp, "dd/MM/yyyy", { locale: ptBR })}</div>
                          <div className="text-muted-foreground">
                            {format(message.timestamp, "HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageHistory;