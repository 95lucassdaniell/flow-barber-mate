import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, Search, Edit, MoreVertical, Settings, Key } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProviders } from "@/hooks/useProviders";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProviderModal from "./ProviderModal";
import ProviderServicesModal from "./ProviderServicesModalSimple";

const ProvidersManagement = () => {
  const { providers, loading, toggleProviderStatus, fetchProviders } = useProviders();
  const { canManageAll, profile, loading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [selectedProviderForServices, setSelectedProviderForServices] = useState(null);

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch = provider.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || provider.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" ? provider.is_active : !provider.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEdit = (provider: any) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProvider(null);
    setIsModalOpen(true);
  };

  const handleManageServices = (provider: any) => {
    setSelectedProviderForServices(provider);
    setIsServicesModalOpen(true);
  };

  const handleGenerateTemporaryPassword = async (provider: any) => {
    try {
      const { data, error } = await supabase.rpc('set_temporary_password', {
        provider_id: provider.id
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Senha temporária gerada",
        description: `Senha: ${data}. Anote e forneça ao prestador.`,
        duration: 10000,
      });

      // Mostrar alerta com a senha
      alert(`Senha temporária gerada para ${provider.full_name}:\n\n${data}\n\nAnote esta senha e forneça ao prestador. Por segurança, esta mensagem não será exibida novamente.`);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Erro ao gerar senha temporária.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "receptionist":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "barber":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "receptionist":
        return "Recepcionista";
      case "barber":
        return "Barbeiro";
      default:
        return role;
    }
  };

  if (loading || authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Prestadores</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check authentication first
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Prestadores</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-lg font-medium">Autenticação necessária</div>
              <p className="text-muted-foreground">
                Você precisa estar logado para gerenciar prestadores.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não há perfil ou barbershop_id, mostrar orientação
  if (!profile?.barbershop_id) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Prestadores</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-lg font-medium">Configuração necessária</div>
              <p className="text-muted-foreground">
                Para gerenciar prestadores, você precisa estar vinculado a uma barbearia. 
                Entre em contato com o administrador do sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Prestadores</h1>
        {canManageAll && (
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Prestador
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Prestadores</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="receptionist">Recepcionista</SelectItem>
                <SelectItem value="barber">Barbeiro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Status</TableHead>
                {canManageAll && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.full_name}</TableCell>
                  <TableCell>{provider.email}</TableCell>
                  <TableCell>{provider.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(provider.role)}>
                      {getRoleLabel(provider.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{provider.commission_rate ? `${provider.commission_rate}%` : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={provider.is_active ? "default" : "secondary"}>
                      {provider.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  {canManageAll && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(provider)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageServices(provider)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Gerenciar Serviços
                          </DropdownMenuItem>
                          {provider.role === 'barber' && (
                            <DropdownMenuItem onClick={() => handleGenerateTemporaryPassword(provider)}>
                              <Key className="mr-2 h-4 w-4" />
                              Gerar Senha Temporária
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={async () => {
                              try {
                                await toggleProviderStatus(provider.id, !provider.is_active);
                                toast({
                                  title: provider.is_active ? "Prestador desativado" : "Prestador ativado",
                                  description: `${provider.full_name} foi ${provider.is_active ? 'desativado' : 'ativado'} com sucesso.`,
                                });
                              } catch (error: any) {
                                toast({
                                  title: "Erro",
                                  description: error?.message || "Erro ao alterar status do prestador.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            {provider.is_active ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredProviders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManageAll ? 7 : 6} className="text-center text-muted-foreground">
                    Nenhum prestador encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProviderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        provider={selectedProvider}
        onSuccess={() => fetchProviders()}
      />

      <ProviderServicesModal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
        provider={selectedProviderForServices}
      />
    </div>
  );
};

export default ProvidersManagement;