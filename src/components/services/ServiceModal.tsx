import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServices, type Service } from "@/hooks/useServices";
import { useToast } from "@/hooks/use-toast";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
}

const ServiceModal = ({ isOpen, onClose, service }: ServiceModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const { addService, updateService } = useServices();
  const { toast } = useToast();

  const isEditing = !!service;

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        duration_minutes: service.duration_minutes.toString() || "",
        is_active: service.is_active ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        duration_minutes: "",
        is_active: true,
      });
    }
  }, [service, isOpen]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do serviço é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.duration_minutes || parseInt(formData.duration_minutes) <= 0) {
      toast({
        title: "Duração inválida",
        description: "Digite uma duração válida em minutos.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        duration_minutes: parseInt(formData.duration_minutes),
        is_active: formData.is_active,
      };

      let success = false;
      
      if (isEditing && service) {
        success = await updateService(service.id, serviceData);
      } else {
        success = await addService(serviceData);
      }

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Serviço" : "Novo Serviço"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Edite as informações do serviço abaixo."
              : "Preencha as informações do novo serviço abaixo."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Nome do serviço *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Corte masculino"
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descreva o serviço oferecido..."
                disabled={loading}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="duration_minutes">Duração (minutos) *</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange("duration_minutes", e.target.value)}
                placeholder="30"
                disabled={loading}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                disabled={loading}
              />
              <Label htmlFor="is_active">Serviço ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? (isEditing ? "Salvando..." : "Criando...") 
                : (isEditing ? "Salvar alterações" : "Criar serviço")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceModal;