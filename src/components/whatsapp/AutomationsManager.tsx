import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WhatsAppAutomation {
  id: string;
  name: string;
  description?: string;
  event_type: string;
  timing_type: string;
  timing_value?: number;
  timing_unit?: string;
  template_id: string;
  is_active: boolean;
  created_at: string;
  whatsapp_templates?: {
    name: string;
    content: string;
  };
}

const AutomationsManager = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [automations, setAutomations] = useState<WhatsAppAutomation[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: 'scheduled',
    timing_type: 'immediate',
    timing_value: 1,
    timing_unit: 'hours',
    template_id: '',
    is_active: true
  });

  const fetchAutomations = async () => {
    if (!profile?.barbershop_id) return;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_automations')
        .select(`
          *,
          whatsapp_templates (name, content)
        `)
        .eq('barbershop_id', profile.barbershop_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutomations(data as any || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar automações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!profile?.barbershop_id) return;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('id, name, content')
        .eq('barbershop_id', profile.barbershop_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      event_type: 'scheduled',
      timing_type: 'immediate',
      timing_value: 1,
      timing_unit: 'hours',
      template_id: '',
      is_active: true
    });
  };

  const handleSave = async () => {
    if (!profile?.barbershop_id) return;
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da automação é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.template_id) {
      toast({
        title: "Erro",
        description: "Template é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (formData.timing_type !== 'immediate' && formData.timing_value <= 0) {
      toast({
        title: "Erro",
        description: "Valor de tempo deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (formData.timing_type === 'before' && formData.event_type !== 'scheduled') {
      toast({
        title: "Erro",
        description: "Timing 'before' só é válido para eventos 'scheduled'.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        barbershop_id: profile.barbershop_id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        event_type: formData.event_type,
        timing_type: formData.timing_type,
        timing_value: formData.timing_type === 'immediate' ? null : formData.timing_value,
        timing_unit: formData.timing_type === 'immediate' ? null : formData.timing_unit,
        template_id: formData.template_id,
        is_active: formData.is_active,
        trigger_type: 'manual' // Required field based on database schema
      };

      const { error } = await supabase
        .from('whatsapp_automations')
        .insert([payload])
        .select();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Automação criada com sucesso.",
      });

      setIsModalOpen(false);
      resetForm();
      fetchAutomations();
    } catch (error) {
      console.error('Error creating automation:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar automação.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
    fetchTemplates();
  }, [profile?.barbershop_id]);

  // Refresh data when modal opens to check for new templates
  useEffect(() => {
    if (isModalOpen) {
      fetchTemplates();
    }
  }, [isModalOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automações WhatsApp</h2>
          <p className="text-muted-foreground">
            Configure disparos automáticos de mensagens baseados em eventos
          </p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automações Configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          {automations.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma automação criada</h3>
              <p className="text-muted-foreground mb-4">
                {templates.length === 0 
                  ? "Primeiro crie templates na aba 'Templates' para poder configurar automações." 
                  : "Crie sua primeira automação para começar a enviar mensagens automáticas."
                }
              </p>
              {templates.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 p-3 rounded-md">
                  💡 Dica: Vá na aba "Templates" e clique em "Criar Templates Padrão" para começar rapidamente!
                </p>
              ) : (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Automação
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Quando</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automations.map((automation) => (
                    <TableRow key={automation.id}>
                      <TableCell>{automation.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {automation.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{automation.timing_type}</TableCell>
                      <TableCell>
                        <Badge variant={automation.is_active ? "default" : "secondary"}>
                          {automation.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Automação</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome da automação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template *</Label>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum template disponível. Crie um template primeiro na aba Templates.
                </p>
              ) : (
                <Select 
                  value={formData.template_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_type">Evento</Label>
              <Select 
                value={formData.event_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendamento</SelectItem>
                  <SelectItem value="cancelled">Cancelamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="no_show">Não compareceu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timing_type">Quando enviar</Label>
              <Select 
                value={formData.timing_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, timing_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Imediatamente</SelectItem>
                  <SelectItem value="before">Antes do evento</SelectItem>
                  <SelectItem value="after">Depois do evento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.timing_type !== 'immediate' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="timing_value">Valor</Label>
                  <Input
                    id="timing_value"
                    type="number"
                    min="1"
                    value={formData.timing_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, timing_value: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timing_unit">Unidade</Label>
                  <Select 
                    value={formData.timing_unit} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timing_unit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutos</SelectItem>
                      <SelectItem value="hours">Horas</SelectItem>
                      <SelectItem value="days">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Automação ativa</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || templates.length === 0}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomationsManager;