import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAutomations } from '@/hooks/useAutomations';
import { Plus, Play, Settings, MessageCircle, Users, TrendingUp, Clock } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AutomationsManager: React.FC = () => {
  const { rules, executions, loading, createRule, updateRule, deleteRule, executeAutomations } = useAutomations();
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'reminder',
    message_template: '',
    trigger_conditions: {},
    actions: {
      send_whatsapp: false,
      notify_staff: false,
      create_promotion: false
    },
    is_active: true
  });

  const ruleTypes = [
    { value: 'reminder', label: 'Lembrete de Agendamento', icon: Clock },
    { value: 'follow_up', label: 'Follow-up Pós-Atendimento', icon: MessageCircle },
    { value: 'churn_alert', label: 'Alerta de Churn', icon: Users },
    { value: 'promotion', label: 'Promoção Automática', icon: TrendingUp }
  ];

  const messageTemplates = {
    reminder: `Olá {{client_name}}! 👋

Lembrando que você tem um agendamento marcado para {{appointment_date}} às {{appointment_time}}.

Confirmando sua presença? 😊

{{barbershop_name}}`,
    follow_up: `Oi {{client_name}}! 😊

Esperamos que tenha gostado do seu atendimento conosco!

Que tal agendar sua próxima visita? Temos horários disponíveis para a próxima semana.

{{barbershop_name}}`,
    churn_alert: `Sentimos sua falta, {{client_name}}! 😢

Já faz um tempo que não nos vemos. Que tal agendar um horário?

Temos uma promoção especial para você: {{promotion_details}}

{{barbershop_name}}`,
    promotion: `{{client_name}}, oferta especial! 🎉

{{promotion_details}}

Válido até {{expiry_date}}. Agende já!

{{barbershop_name}}`
  };

  const handleCreateRule = async () => {
    try {
      await createRule(formData);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar regra:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'reminder',
      message_template: '',
      trigger_conditions: {},
      actions: {
        send_whatsapp: false,
        notify_staff: false,
        create_promotion: false
      },
      is_active: true
    });
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type,
      message_template: messageTemplates[type as keyof typeof messageTemplates] || ''
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = ruleTypes.find(t => t.value === type);
    const Icon = typeInfo?.icon || Settings;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automações</h2>
          <p className="text-muted-foreground">
            Configure mensagens automáticas e alertas inteligentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={executeAutomations} variant="outline" disabled={loading}>
            <Play className="h-4 w-4 mr-2" />
            Executar Agora
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Regra de Automação</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Regra</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Lembrete 24h antes do agendamento"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Automação</Label>
                  <Select value={formData.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o objetivo desta automação"
                  />
                </div>

                <div>
                  <Label htmlFor="message_template">Template da Mensagem</Label>
                  <Textarea
                    id="message_template"
                    value={formData.message_template}
                    onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
                    placeholder="Digite a mensagem que será enviada"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use variáveis como: client_name, appointment_date, barbershop_name
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Ações</Label>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="send_whatsapp" className="text-sm font-normal">
                      Enviar WhatsApp
                    </Label>
                    <Switch
                      id="send_whatsapp"
                      checked={formData.actions.send_whatsapp}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({
                          ...prev,
                          actions: { ...prev.actions, send_whatsapp: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify_staff" className="text-sm font-normal">
                      Notificar Equipe
                    </Label>
                    <Switch
                      id="notify_staff"
                      checked={formData.actions.notify_staff}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({
                          ...prev,
                          actions: { ...prev.actions, notify_staff: checked }
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active" className="text-sm font-normal">
                    Ativar Regra
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, is_active: checked }))
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateRule}>
                    Criar Regra
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Regras ({rules.length})</TabsTrigger>
          <TabsTrigger value="executions">Execuções ({executions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma regra configurada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Crie sua primeira regra de automação para começar a engajar seus clientes
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Regra
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(rule.type)}
                        <div>
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => updateRule(rule.id, { is_active: checked })}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Tipo</p>
                        <p className="text-muted-foreground">
                          {ruleTypes.find(t => t.value === rule.type)?.label}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Ações</p>
                        <div className="flex gap-1 mt-1">
                          {rule.actions?.send_whatsapp && <Badge variant="outline">WhatsApp</Badge>}
                          {rule.actions?.notify_staff && <Badge variant="outline">Notificar</Badge>}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">Criada</p>
                        <p className="text-muted-foreground">
                          {formatDistance(new Date(rule.created_at), new Date(), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          {executions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma execução ainda</h3>
                <p className="text-muted-foreground text-center">
                  As execuções de automação aparecerão aqui quando forem executadas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {executions.map((execution) => (
                <Card key={execution.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">
                            {(execution as any).clients?.full_name || 'Cliente não encontrado'}
                          </p>
                          <Badge variant={getStatusColor(execution.status)}>
                            {execution.status === 'sent' ? 'Enviada' : 
                             execution.status === 'pending' ? 'Pendente' : 'Falhou'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {execution.message_content}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {formatDistance(new Date(execution.execution_date), new Date(), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};