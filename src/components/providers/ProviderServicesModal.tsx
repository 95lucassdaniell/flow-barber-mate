import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, Scissors } from "lucide-react";
import { useProviderServices, type ServiceWithPrice } from "@/hooks/useProviderServices";
import { useToast } from "@/hooks/use-toast";

interface ProviderServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    id: string;
    full_name: string;
  } | null;
}

const ProviderServicesModal = ({ isOpen, onClose, provider }: ProviderServicesModalProps) => {
  const [editingServices, setEditingServices] = useState<{[key: string]: {price: string, isActive: boolean}}>({});
  const [loading, setLoading] = useState(false);
  const { 
    getServicesWithPrices, 
    saveProviderService, 
    removeProviderService,
    loading: servicesLoading 
  } = useProviderServices(provider?.id);
  const { toast } = useToast();

  const services = getServicesWithPrices();

  useEffect(() => {
    if (isOpen && provider) {
      // Initialize editing state with current prices
      const initialState: {[key: string]: {price: string, isActive: boolean}} = {};
      services.forEach(service => {
        initialState[service.id] = {
          price: service.price?.toString() || '',
          isActive: service.is_active || false
        };
      });
      setEditingServices(initialState);
    }
  }, [isOpen, provider, services.length]);

  const handlePriceChange = (serviceId: string, price: string) => {
    setEditingServices(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], price }
    }));
  };

  const handleToggleService = (serviceId: string, isActive: boolean) => {
    setEditingServices(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], isActive }
    }));
  };

  const handleSaveService = async (serviceId: string) => {
    const editingService = editingServices[serviceId];
    if (!editingService) return;

    const price = parseFloat(editingService.price);
    if (editingService.isActive && (isNaN(price) || price <= 0)) {
      toast({
        title: "Preço inválido",
        description: "Digite um preço válido para ativar o serviço.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (editingService.isActive) {
        await saveProviderService(serviceId, price, true);
      } else {
        await removeProviderService(serviceId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const promises = Object.entries(editingServices).map(async ([serviceId, editing]) => {
        const price = parseFloat(editing.price);
        if (editing.isActive && !isNaN(price) && price > 0) {
          return saveProviderService(serviceId, price, true);
        } else if (!editing.isActive) {
          return removeProviderService(serviceId);
        }
        return Promise.resolve(true);
      });

      await Promise.all(promises);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes}min`;
  };

  if (!provider) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Gerenciar Serviços - {provider.full_name}</DialogTitle>
          <DialogDescription>
            Configure os preços e disponibilidade dos serviços para este prestador.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {servicesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                      <div className="h-8 bg-muted rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum serviço disponível</p>
                <p className="text-sm text-muted-foreground">
                  Cadastre serviços na página de Serviços primeiro.
                </p>
              </CardContent>
            </Card>
          ) : (
            services.map((service) => {
              const editing = editingServices[service.id] || { price: '', isActive: false };
              
              return (
                <Card key={service.id} className={editing.isActive ? "border-primary" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <Scissors className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(service.duration_minutes)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={editing.isActive}
                        onCheckedChange={(checked) => handleToggleService(service.id, checked)}
                        disabled={loading}
                      />
                    </div>
                  </CardHeader>
                  
                  {editing.isActive && (
                    <CardContent className="pt-0">
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`price-${service.id}`}>Preço (R$)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              id={`price-${service.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={editing.price}
                              onChange={(e) => handlePriceChange(service.id, e.target.value)}
                              placeholder="0.00"
                              className="pl-10"
                              disabled={loading}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSaveService(service.id)}
                          disabled={loading || !editing.price || parseFloat(editing.price) <= 0}
                          size="sm"
                        >
                          Salvar
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Fechar
          </Button>
          <Button onClick={handleSaveAll} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Todos"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderServicesModal;