import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProviders } from "@/hooks/useProviders";
import { useProviderServices } from "@/hooks/useProviderServices";
import { useToast } from "@/hooks/use-toast";
import { Clock, DollarSign } from "lucide-react";

const providerSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  role: z.enum(["admin", "receptionist", "barber"]),
  commission_rate: z.number().min(0).max(100).optional(),
  is_active: z.boolean().default(true),
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider?: any;
  onSuccess?: () => void;
}

const ProviderModal = ({ isOpen, onClose, provider, onSuccess }: ProviderModalProps) => {
  const { createProvider, updateProvider, loading } = useProviders();
  const { 
    allServices, 
    providerServices, 
    saveProviderService, 
    removeProviderService,
    getServicesWithPrices
  } = useProviderServices(provider?.id);
  const { toast } = useToast();
  const isEditing = !!provider;
  const [servicesChanges, setServicesChanges] = useState<Record<string, { price: number; isActive: boolean }>>({});
  const [savingServices, setSavingServices] = useState(false);

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      role: "barber",
      commission_rate: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (provider) {
      form.reset({
        full_name: provider.full_name || "",
        email: provider.email || "",
        phone: provider.phone || "",
        role: provider.role || "barber",
        commission_rate: provider.commission_rate || 0,
        is_active: provider.is_active ?? true,
      });
      
      // Reset services changes when provider changes
      setServicesChanges({});
    } else {
      form.reset({
        full_name: "",
        email: "",
        phone: "",
        role: "barber",
        commission_rate: 0,
        is_active: true,
      });
      setServicesChanges({});
    }
  }, [provider, form]);

  const onSubmit = async (formData: ProviderFormData) => {
    try {
      console.log('Submitting provider form:', formData);
      let savedProvider;
      
      if (isEditing) {
        savedProvider = await updateProvider(provider.id, formData);
        toast({
          title: "Prestador atualizado",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        const providerData = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          commission_rate: formData.commission_rate,
          is_active: formData.is_active,
        };
        savedProvider = await createProvider(providerData);
        toast({
          title: "Prestador criado",
          description: "O prestador foi adicionado com sucesso.",
        });
      }

      // Save services changes if any
      if (Object.keys(servicesChanges).length > 0) {
        await handleSaveAllServices(savedProvider?.id || provider.id);
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error in form submission:', error);
      
      // Handle specific authentication errors
      if (error?.message?.includes('logado')) {
        toast({
          title: "Autenticação necessária",
          description: "Por favor, faça login novamente para continuar.",
          variant: "destructive",
        });
        return;
      }
      
      if (error?.message?.includes('permissão')) {
        toast({
          title: "Sem permissão",
          description: "Você não tem permissão para realizar esta ação.",
          variant: "destructive",
        });
        return;
      }
      
      const errorMessage = error?.message || 'Ocorreu um erro inesperado ao salvar o prestador.';
      
      toast({
        title: isEditing ? "Erro ao atualizar" : "Erro ao criar",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleServiceChange = (serviceId: string, field: 'price' | 'isActive', value: number | boolean) => {
    setServicesChanges(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        price: field === 'price' ? value as number : prev[serviceId]?.price || 0,
        isActive: field === 'isActive' ? value as boolean : prev[serviceId]?.isActive ?? true,
      }
    }));
  };

  const getServicePrice = (serviceId: string): number => {
    if (servicesChanges[serviceId]?.price !== undefined) {
      return servicesChanges[serviceId].price;
    }
    const existingService = providerServices.find(ps => ps.service_id === serviceId);
    return existingService?.price || 0;
  };

  const getServiceActive = (serviceId: string): boolean => {
    if (servicesChanges[serviceId]?.isActive !== undefined) {
      return servicesChanges[serviceId].isActive;
    }
    const existingService = providerServices.find(ps => ps.service_id === serviceId);
    return existingService?.is_active ?? false;
  };

  const handleSaveAllServices = async (providerId?: string) => {
    if (!providerId) {
      console.warn('No provider ID provided for saving services');
      return;
    }
    
    console.log('Saving services for provider:', providerId, 'Changes:', servicesChanges);
    setSavingServices(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const [serviceId, changes] of Object.entries(servicesChanges)) {
        try {
          if (changes.isActive && changes.price > 0) {
            await saveProviderService(serviceId, changes.price, changes.isActive);
            successCount++;
          } else if (!changes.isActive) {
            await removeProviderService(serviceId);
            successCount++;
          }
        } catch (serviceError) {
          console.error(`Error saving service ${serviceId}:`, serviceError);
          errorCount++;
        }
      }
      
      setServicesChanges({});
      
      if (errorCount === 0) {
        toast({
          title: "Serviços salvos",
          description: "Os preços dos serviços foram atualizados com sucesso.",
        });
      } else if (successCount > 0) {
        toast({
          title: "Parcialmente salvo",
          description: `${successCount} serviços salvos, ${errorCount} com erro.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar nenhum serviço.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error saving services:', error);
      toast({
        title: "Erro",
        description: error?.message || "Erro inesperado ao salvar os serviços.",
        variant: "destructive",
      });
    } finally {
      setSavingServices(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Prestador" : "Adicionar Prestador"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Edite as informações do prestador e configure os serviços oferecidos." 
              : "Adicione um novo prestador à equipe e configure os serviços oferecidos."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      {...form.register("full_name")}
                      placeholder="Digite o nome completo"
                    />
                    {form.formState.errors.full_name && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.full_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="Digite o email"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...form.register("phone")}
                      placeholder="Digite o telefone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select
                      value={form.watch("role")}
                      onValueChange={(value) => form.setValue("role", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="receptionist">Recepcionista</SelectItem>
                        <SelectItem value="barber">Barbeiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commission_rate">Taxa de Comissão (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      {...form.register("commission_rate", { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Ativo</Label>
                    <Switch
                      id="is_active"
                      checked={form.watch("is_active")}
                      onCheckedChange={(checked) => form.setValue("is_active", checked)}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Serviços e Preços */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Serviços e Preços</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure quais serviços este prestador oferece e defina os preços específicos.
              </p>
            </CardHeader>
            <CardContent>
              {allServices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum serviço cadastrado. Cadastre serviços primeiro na aba "Serviços".
                </p>
              ) : (
                <div className="space-y-4">
                  {allServices.map((service) => {
                    const isActive = getServiceActive(service.id);
                    const price = getServicePrice(service.id);
                    
                    return (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                              onChange={(e) => handleServiceChange(service.id, 'price', parseFloat(e.target.value) || 0)}
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
                              onCheckedChange={(checked) => handleServiceChange(service.id, 'isActive', checked)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={loading || savingServices}
            >
              {loading || savingServices ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderModal;