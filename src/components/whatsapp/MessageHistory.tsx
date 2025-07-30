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
import { Search, MessageSquare, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWhatsAppMessages, type WhatsAppMessage } from "@/hooks/useWhatsAppMessages";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MessageHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  
  const { messages: rawMessages, loading, error } = useWhatsAppMessages();

  const getMessageContent = (message: WhatsAppMessage): string => {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (message.content && typeof message.content === 'object') {
      return message.content.text || message.content.caption || 'Conteúdo não textual';
    }
    return 'Mensagem sem conteúdo';
  };

  const getRecipientDisplay = (message: WhatsAppMessage): string => {
    const name = message.contact_name || 'Sem nome';
    const phone = message.phone_number;
    return `${name} (${phone})`;
  };

  const filteredMessages = rawMessages.filter(message => {
    const recipient = getRecipientDisplay(message);
    const content = getMessageContent(message);
    const matchesSearch = recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    const matchesDirection = directionFilter === "all" || message.direction === directionFilter;
    
    return matchesSearch && matchesStatus && matchesDirection;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-600 fill-current" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'read':
        return 'Lido';
      case 'failed':
        return 'Falhou';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'read':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getDirectionLabel = (direction: string) => {
    return direction === 'incoming' ? 'Recebida' : 'Enviada';
  };

  const stats = {
    total: rawMessages.length,
    sent: rawMessages.filter(m => m.status === 'sent').length,
    delivered: rawMessages.filter(m => m.status === 'delivered').length,
    read: rawMessages.filter(m => m.status === 'read').length,
    failed: rawMessages.filter(m => m.status === 'failed').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Mensagens</h2>
          <p className="text-muted-foreground">
            Acompanhe todas as mensagens enviadas via WhatsApp
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Histórico de Mensagens</h2>
          <p className="text-muted-foreground">
            Acompanhe todas as mensagens enviadas via WhatsApp
          </p>
        </div>
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

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

            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Direção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="outgoing">Enviadas</SelectItem>
                <SelectItem value="incoming">Recebidas</SelectItem>
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
              {searchTerm || statusFilter !== "all" || directionFilter !== "all" 
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
                    <TableHead>Direção</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium">
                        {getRecipientDisplay(message)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate">{getMessageContent(message)}</p>
                          {message.appointment_id && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Agendamento
                            </Badge>
                          )}
                          <Badge variant="outline" className="mt-1 ml-1 text-xs">
                            {message.message_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getDirectionLabel(message.direction)}
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
                          <div>{format(new Date(message.created_at), "dd/MM/yyyy", { locale: ptBR })}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
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