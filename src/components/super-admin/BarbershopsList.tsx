import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  ExternalLink, 
  Settings, 
  MoreHorizontal,
  Building2,
  Users,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import BarbershopModal from "./BarbershopModal";

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  total_users: number;
  total_appointments: number;
  monthly_revenue: number;
  created_at: string;
  email?: string;
  phone?: string;
  address?: string;
}

export default function BarbershopsList() {
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [filteredBarbershops, setFilteredBarbershops] = useState<Barbershop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarbershop, setSelectedBarbershop] = useState<Barbershop | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchBarbershops();
  }, []);

  useEffect(() => {
    filterBarbershops();
  }, [searchTerm, statusFilter, planFilter, barbershops]);

  const fetchBarbershops = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('barbershops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBarbershops(data || []);
    } catch (error) {
      console.error('Error fetching barbershops:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar barbearias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBarbershops = () => {
    let filtered = barbershops;

    if (searchTerm) {
      filtered = filtered.filter(barbershop =>
        barbershop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barbershop.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(barbershop => barbershop.status === statusFilter);
    }

    if (planFilter !== "all") {
      filtered = filtered.filter(barbershop => barbershop.plan === planFilter);
    }

    setFilteredBarbershops(filtered);
  };

  const updateBarbershopStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setBarbershops(prev => 
        prev.map(b => b.id === id ? { ...b, status } : b)
      );

      toast({
        title: "Sucesso",
        description: "Status da barbearia atualizado",
      });
    } catch (error) {
      console.error('Error updating barbershop status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativo", variant: "default" },
      inactive: { label: "Inativo", variant: "secondary" },
      suspended: { label: "Suspenso", variant: "destructive" },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const planMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      basic: { label: "Básico", variant: "outline" },
      premium: { label: "Premium", variant: "default" },
      enterprise: { label: "Enterprise", variant: "secondary" },
    };
    
    const planInfo = planMap[plan] || { label: plan, variant: "outline" };
    return <Badge variant={planInfo.variant}>{planInfo.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEdit = (barbershop: Barbershop) => {
    setSelectedBarbershop(barbershop);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedBarbershop(null);
    setIsModalOpen(true);
  };

  const handleModalClose = (shouldRefresh?: boolean) => {
    setIsModalOpen(false);
    setSelectedBarbershop(null);
    if (shouldRefresh) {
      fetchBarbershops();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Barbearias</h1>
          <p className="text-muted-foreground">Gerencie todas as barbearias do sistema</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Barbearia
        </Button>
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
                  placeholder="Buscar por nome ou slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Barbershops Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barbearia</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4" />
                      Usuários
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Agendamentos
                    </div>
                  </TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarbershops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma barbearia encontrada</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBarbershops.map((barbershop) => (
                    <TableRow key={barbershop.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{barbershop.name}</div>
                          <div className="text-sm text-muted-foreground">/{barbershop.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(barbershop.status)}</TableCell>
                      <TableCell>{getPlanBadge(barbershop.plan)}</TableCell>
                      <TableCell className="text-center">{barbershop.total_users || 0}</TableCell>
                      <TableCell className="text-center">{barbershop.total_appointments || 0}</TableCell>
                      <TableCell>{formatCurrency(barbershop.monthly_revenue || 0)}</TableCell>
                      <TableCell>{formatDate(barbershop.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/${barbershop.slug}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(barbershop)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedBarbershop ? "Editar Barbearia" : "Nova Barbearia"}
            </DialogTitle>
          </DialogHeader>
          <BarbershopModal
            barbershop={selectedBarbershop}
            onClose={handleModalClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}