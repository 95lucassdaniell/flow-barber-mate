import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Mail, 
  Calendar,
  Eye,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Client } from "@/hooks/useProviderClients";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProviderClientsListProps {
  clients: Client[];
  loading: boolean;
  onViewClient: (client: Client) => void;
}

const ProviderClientsList = ({ clients, loading, onViewClient }: ProviderClientsListProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "";
    }
  };

  const formatBirthDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd/MM", { locale: ptBR });
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Carregando clientes...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center h-32 flex flex-col items-center justify-center">
            <p className="text-muted-foreground mb-2">Nenhum cliente atendido ainda</p>
            <p className="text-sm text-muted-foreground">
              Complete alguns agendamentos para ver seus clientes aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Atendidos ({clients.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{client.name}</p>
                    {formatBirthDate(client.birth_date) && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatBirthDate(client.birth_date)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {client.phone}
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </div>
                    )}
                  </div>
                  
                  {client.notes && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {client.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right text-sm text-muted-foreground">
                  <p>Cliente desde</p>
                  <p>{formatDate(client.created_at)}</p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewClient(client)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Histórico
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderClientsList;