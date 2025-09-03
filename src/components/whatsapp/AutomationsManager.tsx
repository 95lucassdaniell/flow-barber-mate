import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

  useEffect(() => {
    fetchAutomations();
    fetchTemplates();
  }, [profile?.barbershop_id]);

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
        
        <Button>
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
                Crie sua primeira automação para começar a enviar mensagens automáticas.
              </p>
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
    </div>
  );
};

export default AutomationsManager;