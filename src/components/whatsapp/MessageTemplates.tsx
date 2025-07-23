import { useState } from "react";
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
import { Plus, Edit, Trash2, MessageSquare } from "lucide-react";

interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: 'appointment' | 'reminder' | 'confirmation' | 'general';
  isActive: boolean;
}

const MessageTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Confirmação de Agendamento',
      content: 'Olá {nome}! Seu agendamento foi confirmado para {data} às {hora} com {barbeiro}. Local: {endereco}',
      variables: ['nome', 'data', 'hora', 'barbeiro', 'endereco'],
      category: 'appointment',
      isActive: true
    },
    {
      id: '2',
      name: 'Lembrete 1h Antes',
      content: 'Oi {nome}! Lembrete: você tem agendamento hoje às {hora} com {barbeiro}. Te esperamos!',
      variables: ['nome', 'hora', 'barbeiro'],
      category: 'reminder',
      isActive: true
    },
    {
      id: '3',
      name: 'Solicitar Confirmação',
      content: 'Olá {nome}! Você tem agendamento amanhã às {hora}. Confirma sua presença? Responda SIM ou NÃO.',
      variables: ['nome', 'hora'],
      category: 'confirmation',
      isActive: true
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'general' as Template['category']
  });

  const handleSave = () => {
    try {
      // Extract variables from content
      const variables = formData.content.match(/\{([^}]+)\}/g)?.map(v => v.slice(1, -1)) || [];

      if (editingTemplate) {
        // Update existing template
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id 
            ? { ...t, ...formData, variables }
            : t
        ));
        toast({
          title: "Template atualizado",
          description: "O template foi atualizado com sucesso.",
        });
      } else {
        // Create new template
        const newTemplate: Template = {
          id: Date.now().toString(),
          ...formData,
          variables,
          isActive: true
        };
        setTemplates(prev => [...prev, newTemplate]);
        toast({
          title: "Template criado",
          description: "O template foi criado com sucesso.",
        });
      }

      // Reset form
      setFormData({ name: '', content: '', category: 'general' });
      setEditingTemplate(null);
      setIsModalOpen(false);
    } catch (error) {
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

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Template removido",
      description: "O template foi removido com sucesso.",
    });
  };

  const getCategoryLabel = (category: Template['category']) => {
    const labels = {
      appointment: 'Agendamento',
      reminder: 'Lembrete',
      confirmation: 'Confirmação',
      general: 'Geral'
    };
    return labels[category];
  };

  const getCategoryColor = (category: Template['category']) => {
    const colors = {
      appointment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      reminder: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      confirmation: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[category];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Templates de Mensagens</h2>
          <p className="text-muted-foreground">
            Crie e gerencie templates para automatizar mensagens do WhatsApp
          </p>
        </div>
        
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
                  Use chaves para variáveis dinâmicas: {"{nome}"}, {"{data}"}, {"{hora}"}, {"{barbeiro}"}, etc.
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
                Crie seu primeiro template de mensagem para automatizar a comunicação.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Template
              </Button>
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
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Ativo" : "Inativo"}
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