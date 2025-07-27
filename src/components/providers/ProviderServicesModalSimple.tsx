import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProviderServices } from "@/hooks/useProviderServices";
import { useToast } from "@/hooks/use-toast";
import { Clock, DollarSign, Loader2 } from "lucide-react";

interface ProviderServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    id: string;
    full_name: string;
  } | null;
}

const ProviderServicesModal = ({ isOpen, onClose, provider }: ProviderServicesModalProps) => {
  const { 
    allServices, 
    providerServices, 
    loading, 
    saveProviderService, 
    removeProviderService,
    refetch
  } = useProviderServices(provider?.id);
  const { toast } = useToast();
  const [editingServices, setEditingServices] = useState<Record<string, { price: number; isActive: boolean }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && provider?.id) {
      refetch();
      setEditingServices({});
    }
  }, [isOpen, provider?.id, refetch]);

  const handlePriceChange = (serviceId: string, price: number) => {
    setEditingServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        price,
        isActive: prev[serviceId]?.isActive ?? getServiceActive(serviceId)
      }
    }));
  };

  const handleToggleService = (serviceId: string, isActive: boolean) => {
    setEditingServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        price: prev[serviceId]?.price ?? getServicePrice(serviceId),
        isActive
      }
    }));
  };

  const getServicePrice = (serviceId: string): number => {
    if (editingServices[serviceId]?.price !== undefined) {
      return editingServices[serviceId].price;
    }
    const existingService = providerServices.find(ps => ps.service_id === serviceId);
    return existingService?.price || 0;
  };

  const getServiceActive = (serviceId: string): boolean => {
    if (editingServices[serviceId]?.isActive !== undefined) {
      return editingServices[serviceId].isActive;
    }
    const existingService = providerServices.find(ps => ps.service_id === serviceId);
    return existingService?.is_active ?? false;
  };

  const handleSaveService = async (serviceId: string) => {
    const changes = editingServices[serviceId];
    if (!changes) return;

    try {
      setSaving(true);
      if (changes.isActive && changes.price > 0) {
        await saveProviderService(serviceId, changes.price, changes.isActive);
      } else if (!changes.isActive) {
        await removeProviderService(serviceId);
      }
      
      // Remove from editing state after successful save
      setEditingServices(prev => {
        const newState = { ...prev };
        delete newState[serviceId];
        return newState;
      });
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (Object.keys(editingServices).length === 0) {
      onClose();
      return;
    }

    try {
      setSaving(true);
      for (const [serviceId, changes] of Object.entries(editingServices)) {
        if (changes.isActive && changes.price > 0) {
          await saveProviderService(serviceId, changes.price, changes.isActive);
        } else if (!changes.isActive) {
          await removeProviderService(serviceId);
        }
      }
      
      setEditingServices({});
      toast({
        title: "Serviços salvos",
        description: "Todos os serviços foram atualizados com sucesso.",
      });
      onClose();
    } catch (error) {
      console.error('Error saving services:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar alguns serviços.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  if (!provider) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Serviços - {provider.full_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando serviços...</span>
            </div>
          ) : allServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum serviço cadastrado. Cadastre serviços primeiro na aba "Serviços".
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allServices.map((service) => {
                const isActive = getServiceActive(service.id);
                const price = getServicePrice(service.id);
                const hasChanges = editingServices[service.id];
                
                return (
                  <Card key={service.id} className={hasChanges ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-medium">{service.name}</h4>
                              {service.description && (
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {formatDuration(service.duration_minutes)}
                                </span>
                                {hasChanges && (
                                  <Badge variant="outline" className="text-xs">
                                    Modificado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={price}
                              onChange={(e) => handlePriceChange(service.id, parseFloat(e.target.value) || 0)}
                              className="w-24"
                              placeholder="0.00"
                              disabled={!isActive}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`service-${service.id}`} className="text-sm">
                              Ativo
                            </Label>
                            <Switch
                              id={`service-${service.id}`}
                              checked={isActive}
                              onCheckedChange={(checked) => handleToggleService(service.id, checked)}
                            />
                          </div>

                          {hasChanges && (
                            <Button
                              size="sm"
                              onClick={() => handleSaveService(service.id)}
                              disabled={saving}
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Separator />

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button 
              onClick={handleSaveAll} 
              disabled={saving || Object.keys(editingServices).length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar Todos"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderServicesModal;