import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Shield, 
  Mail, 
  Database, 
  CreditCard,
  Bell,
  Globe,
  Lock,
  Server,
  AlertTriangle,
  CheckCircle,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SystemConfig {
  maintenance_mode: boolean;
  allow_registrations: boolean;
  max_barbershops: number;
  default_plan: string;
  system_email: string;
  support_email: string;
  notification_email: boolean;
  backup_enabled: boolean;
  backup_frequency: string;
  api_rate_limit: number;
  max_users_per_barbershop: number;
  max_appointments_per_day: number;
  session_timeout: number;
  password_min_length: number;
  require_email_verification: boolean;
  enable_2fa: boolean;
}

interface PlanConfig {
  id: string;
  name: string;
  price: number;
  max_users: number;
  max_appointments: number;
  features: string[];
  active: boolean;
}

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maintenance_mode: false,
    allow_registrations: true,
    max_barbershops: 100,
    default_plan: "basic",
    system_email: "sistema@barberflow.com",
    support_email: "suporte@barberflow.com",
    notification_email: true,
    backup_enabled: true,
    backup_frequency: "daily",
    api_rate_limit: 1000,
    max_users_per_barbershop: 20,
    max_appointments_per_day: 50,
    session_timeout: 24,
    password_min_length: 8,
    require_email_verification: true,
    enable_2fa: false,
  });

  const [plans, setPlans] = useState<PlanConfig[]>([
    {
      id: "basic",
      name: "Básico",
      price: 29.90,
      max_users: 5,
      max_appointments: 100,
      features: ["Agendamentos", "Clientes", "Relatórios Básicos"],
      active: true
    },
    {
      id: "premium",
      name: "Premium",
      price: 59.90,
      max_users: 15,
      max_appointments: 500,
      features: ["Agendamentos", "Clientes", "Relatórios Avançados", "WhatsApp", "Comissões"],
      active: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 99.90,
      max_users: 50,
      max_appointments: 1000,
      features: ["Todas as funcionalidades", "API", "Suporte Prioritário", "Multi-unidades"],
      active: true
    }
  ]);

  const { toast } = useToast();

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      // Em um cenário real, carregaria as configurações do banco
      // Por agora, usamos valores padrão
      console.log("Configurações carregadas");
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const saveSystemConfig = async () => {
    setLoading(true);
    try {
      // Aqui salvaria no banco de dados
      // await supabase.from('system_config').upsert(systemConfig);
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      });
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSystemConfig = (key: keyof SystemConfig, value: any) => {
    setSystemConfig(prev => ({ ...prev, [key]: value }));
  };

  const updatePlan = (planId: string, updates: Partial<PlanConfig>) => {
    setPlans(prev => 
      prev.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      )
    );
  };

  const getMaintenanceStatus = () => {
    return systemConfig.maintenance_mode ? (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Modo Manutenção
      </Badge>
    ) : (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Sistema Operacional
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Gerencie configurações globais do sistema</p>
        </div>
        <div className="flex items-center gap-4">
          {getMaintenanceStatus()}
          <Button onClick={saveSystemConfig} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Configurações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max_barbershops">Máximo de Barbearias</Label>
                  <Input
                    id="max_barbershops"
                    type="number"
                    value={systemConfig.max_barbershops}
                    onChange={(e) => updateSystemConfig('max_barbershops', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_plan">Plano Padrão</Label>
                  <Select value={systemConfig.default_plan} onValueChange={(value) => updateSystemConfig('default_plan', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Modo Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Desabilita acesso de usuários ao sistema
                    </p>
                  </div>
                  <Switch
                    checked={systemConfig.maintenance_mode}
                    onCheckedChange={(checked) => updateSystemConfig('maintenance_mode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Permitir Registros</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir novos cadastros de barbearias
                    </p>
                  </div>
                  <Switch
                    checked={systemConfig.allow_registrations}
                    onCheckedChange={(checked) => updateSystemConfig('allow_registrations', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Configurações de segurança e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Tamanho Mínimo da Senha</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={systemConfig.password_min_length}
                    onChange={(e) => updateSystemConfig('password_min_length', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Timeout da Sessão (horas)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={systemConfig.session_timeout}
                    onChange={(e) => updateSystemConfig('session_timeout', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Verificação de Email Obrigatória</Label>
                    <p className="text-sm text-muted-foreground">
                      Requerer verificação de email para novos usuários
                    </p>
                  </div>
                  <Switch
                    checked={systemConfig.require_email_verification}
                    onCheckedChange={(checked) => updateSystemConfig('require_email_verification', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Autenticação 2FA</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilitar autenticação de dois fatores
                    </p>
                  </div>
                  <Switch
                    checked={systemConfig.enable_2fa}
                    onCheckedChange={(checked) => updateSystemConfig('enable_2fa', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Email
              </CardTitle>
              <CardDescription>
                Configurações de email e notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="system_email">Email do Sistema</Label>
                  <Input
                    id="system_email"
                    type="email"
                    value={systemConfig.system_email}
                    onChange={(e) => updateSystemConfig('system_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Email de Suporte</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={systemConfig.support_email}
                    onChange={(e) => updateSystemConfig('support_email', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações do sistema por email
                    </p>
                  </div>
                  <Switch
                    checked={systemConfig.notification_email}
                    onCheckedChange={(checked) => updateSystemConfig('notification_email', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Settings */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configuração de Planos
              </CardTitle>
              <CardDescription>
                Gerencie os planos disponíveis para as barbearias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Switch
                          checked={plan.active}
                          onCheckedChange={(checked) => updatePlan(plan.id, { active: checked })}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={plan.price}
                            onChange={(e) => updatePlan(plan.id, { price: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Máx. Usuários</Label>
                          <Input
                            type="number"
                            value={plan.max_users}
                            onChange={(e) => updatePlan(plan.id, { max_users: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Máx. Agendamentos</Label>
                          <Input
                            type="number"
                            value={plan.max_appointments}
                            onChange={(e) => updatePlan(plan.id, { max_appointments: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Badge variant={plan.active ? "default" : "secondary"}>
                            {plan.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Funcionalidades</Label>
                        <Textarea
                          value={plan.features.join(', ')}
                          onChange={(e) => updatePlan(plan.id, { features: e.target.value.split(', ') })}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configurações técnicas e de performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="api_rate_limit">Limite de API (req/min)</Label>
                  <Input
                    id="api_rate_limit"
                    type="number"
                    value={systemConfig.api_rate_limit}
                    onChange={(e) => updateSystemConfig('api_rate_limit', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_users_per_barbershop">Máx. Usuários por Barbearia</Label>
                  <Input
                    id="max_users_per_barbershop"
                    type="number"
                    value={systemConfig.max_users_per_barbershop}
                    onChange={(e) => updateSystemConfig('max_users_per_barbershop', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="max_appointments_per_day">Máx. Agendamentos por Dia</Label>
                  <Input
                    id="max_appointments_per_day"
                    type="number"
                    value={systemConfig.max_appointments_per_day}
                    onChange={(e) => updateSystemConfig('max_appointments_per_day', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup_frequency">Frequência de Backup</Label>
                  <Select value={systemConfig.backup_frequency} onValueChange={(value) => updateSystemConfig('backup_frequency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Realizar backup automático dos dados
                    </p>
                  </div>
                  <Switch
                    checked={systemConfig.backup_enabled}
                    onCheckedChange={(checked) => updateSystemConfig('backup_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}