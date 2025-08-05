import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminSubscriptionPlans } from "@/hooks/useAdminSubscriptionPlans";
import { useProviders } from "@/hooks/useProviders";
import { useServices } from "@/hooks/useServices";
import { formatCurrency } from "@/lib/utils";

const formSchema = z.object({
  provider_id: z.string().min(1, "Selecione um prestador"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  monthly_price: z.number().min(0, "Preço deve ser maior que zero"),
  included_services_count: z.number().min(1, "Deve incluir pelo menos 1 serviço"),
  commission_percentage: z.number().min(0).max(100, "Comissão deve estar entre 0% e 100%"),
  enabled_service_ids: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
});

type FormData = z.infer<typeof formSchema>;

interface AdminSubscriptionPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: any;
  onSuccess: () => void;
}

export function AdminSubscriptionPlanModal({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: AdminSubscriptionPlanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPlan, updatePlan } = useAdminSubscriptionPlans();
  const { providers } = useProviders();
  const { services } = useServices();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider_id: "",
      name: "",
      description: "",
      monthly_price: 0,
      included_services_count: 1,
      commission_percentage: 50,
      enabled_service_ids: [],
    },
  });

  const watchedValues = form.watch();
  const commissionAmount = (watchedValues.monthly_price * watchedValues.commission_percentage) / 100;
  const netAmount = watchedValues.monthly_price - commissionAmount;

  useEffect(() => {
    if (plan) {
      form.reset({
        provider_id: plan.provider_id,
        name: plan.name,
        description: plan.description || "",
        monthly_price: plan.monthly_price,
        included_services_count: plan.included_services_count,
        commission_percentage: plan.commission_percentage,
        enabled_service_ids: plan.enabled_service_ids || [],
      });
    } else {
      form.reset({
        provider_id: "",
        name: "",
        description: "",
        monthly_price: 0,
        included_services_count: 1,
        commission_percentage: 50,
        enabled_service_ids: [],
      });
    }
  }, [plan, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      if (plan) {
        await updatePlan(plan.id, data as any);
      } else {
        await createPlan(data as any);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeProviders = providers.filter(provider => provider.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? "Editar Plano" : "Criar Novo Plano"}
          </DialogTitle>
          <DialogDescription>
            {plan
              ? "Edite as informações do plano de assinatura"
              : "Crie um novo plano de assinatura para um prestador"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="provider_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prestador</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!plan} // Disable when editing
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um prestador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.full_name} - {provider.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Plano</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Plano Básico" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os benefícios do plano..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthly_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Mensal (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="included_services_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviços Inclusos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="commission_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão do Prestador (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="50"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enabled_service_ids"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Serviços Habilitados</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Selecione quais serviços estarão disponíveis neste plano
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {services.map((service) => (
                      <FormField
                        key={service.id}
                        control={form.control}
                        name="enabled_service_ids"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={service.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, service.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== service.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {service.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview dos valores */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium">Resumo Financeiro:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Preço do Plano</p>
                  <p className="font-medium">{formatCurrency(watchedValues.monthly_price)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comissão Prestador</p>
                  <p className="font-medium">{formatCurrency(commissionAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Líquido</p>
                  <p className="font-medium">{formatCurrency(netAmount)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Salvando..."
                  : plan
                  ? "Atualizar"
                  : "Criar Plano"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}