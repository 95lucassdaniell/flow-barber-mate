import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Calendar, DollarSign, Plus, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalBarbershops: number;
  activeBarbershops: number;
  totalUsers: number;
  totalAppointments: number;
  monthlyRevenue: number;
  newBarbershopsThisMonth: number;
}

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  total_users: number;
  total_appointments: number;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBarbershops: 0,
    activeBarbershops: 0,
    totalUsers: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
    newBarbershopsThisMonth: 0,
  });
  const [recentBarbershops, setRecentBarbershops] = useState<Barbershop[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch barbershops
      const { data: barbershops, error: barbershopsError } = await supabase
        .from('barbershops')
        .select('*')
        .order('created_at', { ascending: false });

      if (barbershopsError) throw barbershopsError;

      // Calculate stats
      const totalBarbershops = barbershops?.length || 0;
      const activeBarbershops = barbershops?.filter(b => b.status === 'active').length || 0;
      const totalUsers = barbershops?.reduce((sum, b) => sum + (b.total_users || 0), 0) || 0;
      const totalAppointments = barbershops?.reduce((sum, b) => sum + (b.total_appointments || 0), 0) || 0;
      const monthlyRevenue = barbershops?.reduce((sum, b) => sum + (b.monthly_revenue || 0), 0) || 0;

      // Calculate new barbershops this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const newBarbershopsThisMonth = barbershops?.filter(b => {
        const createdDate = new Date(b.created_at);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length || 0;

      setStats({
        totalBarbershops,
        activeBarbershops,
        totalUsers,
        totalAppointments,
        monthlyRevenue,
        newBarbershopsThisMonth,
      });

      setRecentBarbershops(barbershops?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
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
          <h1 className="text-3xl font-bold">Dashboard Super Admin</h1>
          <p className="text-muted-foreground">Visão geral de todas as barbearias</p>
        </div>
        <Button onClick={() => navigate('/super-admin/barbershops')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Barbearia
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Barbearias</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBarbershops}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeBarbershops} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Todos os usuários ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Histórico completo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newBarbershopsThisMonth} novas este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Barbershops */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Barbearias Recentes</CardTitle>
              <CardDescription>Últimas barbearias cadastradas no sistema</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/super-admin/barbershops')}>
              Ver Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBarbershops.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma barbearia cadastrada ainda
              </p>
            ) : (
              recentBarbershops.map((barbershop) => (
                <div
                  key={barbershop.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{barbershop.name}</h3>
                      {getStatusBadge(barbershop.status)}
                      {getPlanBadge(barbershop.plan)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {barbershop.total_users} usuários • {barbershop.total_appointments} agendamentos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Criada em {formatDate(barbershop.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/app/${barbershop.slug}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Acessar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}