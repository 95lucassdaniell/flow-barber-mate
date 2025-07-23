import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Users, 
  Building2,
  Shield,
  Scissors,
  UserCheck,
  Settings,
  Eye,
  Ban,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  commission_rate?: number;
  created_at: string;
  barbershop_id: string;
  barbershop?: {
    name: string;
    slug: string;
  };
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  barberUsers: number;
  receptionistUsers: number;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [barbershopFilter, setBarbershopFilter] = useState("all");
  const [barbershops, setBarbershops] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    barberUsers: 0,
    receptionistUsers: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsersAndBarbershops();
  }, []);

  useEffect(() => {
    filterUsers();
    calculateStats();
  }, [searchTerm, roleFilter, statusFilter, barbershopFilter, users]);

  const fetchUsersAndBarbershops = async () => {
    try {
      setLoading(true);
      
      // Fetch users with barbershop info
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          barbershop:barbershops!inner(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch barbershops for filter
      const { data: barbershopsData, error: barbershopsError } = await supabase
        .from('barbershops')
        .select('id, name, slug')
        .order('name');

      if (barbershopsError) throw barbershopsError;

      setUsers(usersData || []);
      setBarbershops(barbershopsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.barbershop?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter(user => user.is_active === isActive);
    }

    if (barbershopFilter !== "all") {
      filtered = filtered.filter(user => user.barbershop_id === barbershopFilter);
    }

    setFilteredUsers(filtered);
  };

  const calculateStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const barberUsers = users.filter(u => u.role === 'barber').length;
    const receptionistUsers = users.filter(u => u.role === 'receptionist').length;

    setStats({
      totalUsers,
      activeUsers,
      adminUsers,
      barberUsers,
      receptionistUsers,
    });
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(u => u.id === userId ? { ...u, is_active: isActive } : u)
      );

      toast({
        title: "Sucesso",
        description: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      admin: { label: "Admin", variant: "default", icon: Shield },
      barber: { label: "Barbeiro", variant: "secondary", icon: Scissors },
      receptionist: { label: "Recepcionista", variant: "outline", icon: UserCheck },
    };
    
    const roleInfo = roleMap[role] || { label: role, variant: "outline", icon: Users };
    const IconComponent = roleInfo.icon;
    
    return (
      <Badge variant={roleInfo.variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {roleInfo.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className="gap-1">
        {isActive ? <CheckCircle className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
        {isActive ? "Ativo" : "Inativo"}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return "-";
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const showUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie todos os usuários do sistema</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">usuários</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">usuários ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminUsers}</div>
            <p className="text-xs text-muted-foreground">administradores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barbeiros</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.barberUsers}</div>
            <p className="text-xs text-muted-foreground">barbeiros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recepcionistas</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.receptionistUsers}</div>
            <p className="text-xs text-muted-foreground">recepcionistas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou barbearia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="barber">Barbeiro</SelectItem>
                <SelectItem value="receptionist">Recepcionista</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={barbershopFilter} onValueChange={setBarbershopFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Barbearia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {barbershops.map((barbershop) => (
                  <SelectItem key={barbershop.id} value={barbershop.id}>
                    {barbershop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Barbearia</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{user.barbershop?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                    <TableCell>{formatPhone(user.phone)}</TableCell>
                    <TableCell>
                      {user.commission_rate ? `${user.commission_rate}%` : "-"}
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showUserDetails(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserStatus(user.id, !user.is_active)}
                        >
                          {user.is_active ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">INFORMAÇÕES PESSOAIS</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Nome Completo</label>
                      <p className="text-sm text-muted-foreground">{selectedUser.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Telefone</label>
                      <p className="text-sm text-muted-foreground">{formatPhone(selectedUser.phone)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">INFORMAÇÕES PROFISSIONAIS</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Barbearia</label>
                      <p className="text-sm text-muted-foreground">{selectedUser.barbershop?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cargo</label>
                      <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedUser.is_active)}</div>
                    </div>
                    {selectedUser.commission_rate && (
                      <div>
                        <label className="text-sm font-medium">Taxa de Comissão</label>
                        <p className="text-sm text-muted-foreground">{selectedUser.commission_rate}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">INFORMAÇÕES DO SISTEMA</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Data de Criação</label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">ID do Usuário</label>
                    <p className="text-sm text-muted-foreground font-mono text-xs">{selectedUser.user_id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}