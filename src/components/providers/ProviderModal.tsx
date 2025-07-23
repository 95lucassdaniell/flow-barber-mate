import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProviders } from "@/hooks/useProviders";
import { useToast } from "@/hooks/use-toast";

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
}

const ProviderModal = ({ isOpen, onClose, provider }: ProviderModalProps) => {
  const { createProvider, updateProvider, loading } = useProviders();
  const { toast } = useToast();
  const isEditing = !!provider;

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
    } else {
      form.reset({
        full_name: "",
        email: "",
        phone: "",
        role: "barber",
        commission_rate: 0,
        is_active: true,
      });
    }
  }, [provider, form]);

  const onSubmit = async (formData: ProviderFormData) => {
    try {
      if (isEditing) {
        await updateProvider(provider.id, formData);
        toast({
          title: "Prestador atualizado",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        // Ensure required fields are present
        const providerData = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          commission_rate: formData.commission_rate,
          is_active: formData.is_active,
        };
        await createProvider(providerData);
        toast({
          title: "Prestador criado",
          description: "O prestador foi adicionado com sucesso.",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o prestador.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Prestador" : "Adicionar Prestador"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderModal;