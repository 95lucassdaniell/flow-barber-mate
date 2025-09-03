import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: 'appointment' | 'marketing' | 'reminder' | 'confirmation' | 'general';
  trigger_type?: 'appointment_created' | 'appointment_reminder' | 'appointment_confirmation' | null;
  is_active: boolean;
}

const MessageTemplates = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'general' as Template['category']
  });

  // Fetch templates from database
  const fetchTemplates = async () => {
    if (!profile?.barbershop_id) return;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert database data to match our interface
      const formattedTemplates = (data || []).map(template => ({
        id: template.id,
        name: template.name,
        content: template.content,
        variables: Array.isArray(template.variables) ? template.variables.map(v => String(v)) : [],
        category: template.category as Template['category'],
        trigger_type: null, // Will be set based on category
        is_active: template.is_active
      }));
      setTemplates(formattedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [profile?.barbershop_id]);

  const handleSave = async () => {
    if (!profile?.barbershop_id) return;

    try {
      // Extract variables from content
      const variables = formData.content.match(/\{([^}]+)\}/g)?.map(v => v.slice(1, -1)) || [];
      
      // Determine trigger_type based on category
      const getTriggerType = (category: string) => {
        switch (category) {
          case 'appointment':
            return 'appointment_created';
          case 'reminder':
            return 'appointment_reminder';
          case 'confirmation':
            return 'appointment_confirmation';
          default:
            return null;
        }
      };

      const templateData = {
        barbershop_id: profile.barbershop_id,
        name: formData.name,
        content: formData.content,
        variables,
        category: formData.category,
        trigger_type: getTriggerType(formData.category),
        is_active: true
      };

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('whatsapp_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: "Template atualizado",
          description: "O template foi atualizado com sucesso.",
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from('whatsapp_templates')
          .insert([templateData]);

        if (error) throw error;

        toast({
          title: "Template criado",
          description: "O template foi criado com sucesso.",
        });
      }

      // Reset form and refresh data
      setFormData({ name: '', content: '', category: 'general' });
      setEditingTemplate(null);
      setIsModalOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar o template.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Template removido",
        description: "O template foi removido com sucesso.",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover o template.",
        variant: "destructive",
      });
    }
  };

  const getCategoryLabel = (category: Template['category']) => {
    const labels = {
      appointment: 'Agendamento',
      marketing: 'Marketing',
      reminder: 'Lembrete',
      confirmation: 'Confirmação',
      general: 'Geral'
    };
    return labels[category];
  };

  const getCategoryColor = (category: Template['category']) => {
    const colors = {
      appointment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      reminder: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      confirmation: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[category];
  };

  const createDefaultTemplates = async () => {
    if (!profile?.barbershop_id) return;

    try {
      const defaultTemplates = [
        {
          barbershop_id: profile.barbershop_id,
          name: 'Confirmação de Agendamento',
          content: 'Olá {client_name}! Seu agendamento foi confirmado para {appointment_date} às {appointment_time} com {barber_name}. Aguardamos você! 💈',
          variables: ['client_name', 'appointment_date', 'appointment_time', 'barber_name'],
          category: 'confirmation',
          trigger_type: 'appointment_confirmation',
          is_active: true
        },
        {
          barbershop_id: profile.barbershop_id,
          name: 'Lembrete de Agendamento',
          content: 'Oi {client_name}! Lembrando que você tem agendamento hoje às {appointment_time} com {barber_name} na {barbershop_name}. Te esperamos! ⏰',
          variables: ['client_name', 'appointment_time', 'barber_name', 'barbershop_name'],
          category: 'reminder',
          trigger_type: 'appointment_reminder',
          is_active: true
        },
        {
          barbershop_id: profile.barbershop_id,
          name: 'Agradecimento Pós-Atendimento',
          content: 'Obrigado por escolher a {barbershop_name}, {client_name}! Esperamos que tenha gostado do atendimento com {barber_name}. Volte sempre! 😊',
          variables: ['barbershop_name', 'client_name', 'barber_name'],
          category: 'general',
          trigger_type: null,
          is_active: true
        }
      ];

      const { data: templatesData, error: templatesError } = await supabase
        .from('whatsapp_templates')
        .insert(defaultTemplates)
        .select();

      if (templatesError) throw templatesError;

      // Criar automações padrão
      if (templatesData && templatesData.length >= 2) {
        const confirmationTemplate = templatesData.find(t => t.category === 'confirmation');
        const reminderTemplate = templatesData.find(t => t.category === 'reminder');

        if (confirmationTemplate && reminderTemplate) {
          const defaultAutomations = [
            {
              barbershop_id: profile.barbershop_id,
              name: 'Confirmação Imediata',
              description: 'Envia confirmação imediatamente após o agendamento',
              event_type: 'scheduled',
              timing_type: 'immediate',
              template_id: confirmationTemplate.id,
              trigger_type: 'automatic',
              is_active: true
            },
            {
              barbershop_id: profile.barbershop_id,
              name: 'Lembrete 2 Horas Antes',
              description: 'Envia lembrete 2 horas antes do agendamento',
              event_type: 'scheduled',
              timing_type: 'before',
              timing_value: 2,
              timing_unit: 'hours',
              template_id: reminderTemplate.id,
              trigger_type: 'automatic',
              is_active: true
            }
          ];

          const { error: automationsError } = await supabase
            .from('whatsapp_automations')
            .insert(defaultAutomations);

          if (automationsError) throw automationsError;
        }
      }

      toast({
        title: "Templates criados!",
        description: "Templates e automações padrão criados com sucesso.",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error creating default templates:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar templates padrão.",
        variant: "destructive",
      });
    }
  };

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
          <h2 className="text-2xl font-bold">Templates de Mensagens</h2>
          <p className="text-muted-foreground">
            Crie e gerencie templates para automatizar mensagens do WhatsApp
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Confirmação de Agendamento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <select
                    className="w-full p-2 border border-input rounded-md bg-background"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Template['category'] }))}
                  >
                    <option value="appointment">Agendamento</option>
                    <option value="reminder">Lembrete</option>
                    <option value="confirmation">Confirmação</option>
                    <option value="marketing">Marketing</option>
                    <option value="general">Geral</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo da Mensagem</Label>
                  <Textarea
                    id="content"
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Digite sua mensagem. Use {variavel} para campos dinâmicos como {nome}, {data}, {hora}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use chaves para variáveis dinâmicas: {"{nome}"}, {"{data}"}, {"{hora}"}, {"{barbeiro}"}, {"{endereco}"}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingTemplate ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {templates.length === 0 && (
            <Button variant="outline" onClick={createDefaultTemplates}>
              Criar Templates Padrão
            </Button>
          )}
        </div>
      </div>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Templates Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum template criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie templates para automatizar a comunicação via WhatsApp.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={createDefaultTemplates}>
                  Criar Templates Padrão
                </Button>
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Manualmente
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Variáveis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {template.content}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(template.category)}>
                          {getCategoryLabel(template.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((variable, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {"{" + variable + "}"}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

export default MessageTemplates;