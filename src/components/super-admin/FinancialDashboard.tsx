import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Users, Calendar, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinancialOverview {
  total_active_accounts: number;
  total_trial_accounts: number;
  total_overdue_accounts: number;
  total_cancelled_accounts: number;
  monthly_revenue: number;
  annual_revenue: number;
}

interface Barbershop {
  id: string;
  name: string;
  email: string;
  plan: string;
  payment_status: string;
  monthly_revenue: number;
  trial_start_date: string;
  trial_end_date: string;
  next_billing_date: string;
  total_users: number;
  total_appointments: number;
}

const FinancialDashboard = () => {
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [filteredBarbershops, setFilteredBarbershops] = useState<Barbershop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const { toast } = useToast();

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch overview
      const { data: overviewData, error: overviewError } = await supabase
        .rpc('get_financial_overview');
      
      if (overviewError) throw overviewError;
      setOverview(overviewData[0]);

      // Fetch barbershops
      const { data: barbershopsData, error: barbershopsError } = await supabase
        .from('barbershops')
        .select('*')
        .order('name');
      
      if (barbershopsError) throw barbershopsError;
      setBarbershops(barbershopsData || []);
      setFilteredBarbershops(barbershopsData || []);
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao carregar dados financeiros: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  useEffect(() => {
    let filtered = barbershops;

    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.payment_status === statusFilter);
    }

    if (planFilter !== "all") {
      filtered = filtered.filter(b => b.plan === planFilter);
    }

    setFilteredBarbershops(filtered);
  }, [searchTerm, statusFilter, planFilter, barbershops]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-500';
      case 'trial': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'current': return 'Ativo';
      case 'trial': return 'Teste';
      case 'overdue': return 'Atrasado';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'trial': return 'Teste';
      case 'basic': return 'Básico';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Empresarial';
      default: return plan;
    }
  };

  const updatePaymentStatus = async (barbershopId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({ payment_status: newStatus })
        .eq('id', barbershopId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status de pagamento atualizado com sucesso",
      });

      fetchFinancialData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status: " + error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overview?.total_active_accounts || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Teste</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {overview?.total_trial_accounts || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overview?.total_overdue_accounts || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {Number(overview?.monthly_revenue || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              ARR: R$ {Number(overview?.annual_revenue || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="billing">Cobrança</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="current">Ativo</SelectItem>
                <SelectItem value="trial">Teste</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="trial">Teste</SelectItem>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clients Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barbearia</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>Próx. Cobrança</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarbershops.map((barbershop) => (
                  <TableRow key={barbershop.id}>
                    <TableCell className="font-medium">{barbershop.name}</TableCell>
                    <TableCell>{barbershop.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPlanLabel(barbershop.plan)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(barbershop.payment_status)}>
                        {getStatusLabel(barbershop.payment_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      R$ {Number(barbershop.monthly_revenue || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell>
                      {barbershop.next_billing_date ? 
                        format(new Date(barbershop.next_billing_date), 'dd/MM/yyyy', { locale: ptBR }) 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{barbershop.total_users || 0}</TableCell>
                    <TableCell>
                      <Select
                        value={barbershop.payment_status}
                        onValueChange={(value) => updatePaymentStatus(barbershop.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current">Ativo</SelectItem>
                          <SelectItem value="trial">Teste</SelectItem>
                          <SelectItem value="overdue">Atrasado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade de gestão de planos em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Cobrança</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade de histórico de cobrança em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade de relatórios em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;