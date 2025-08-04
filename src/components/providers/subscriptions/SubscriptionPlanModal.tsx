import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useProviderSubscriptionPlans } from "@/hooks/useProviderSubscriptionPlans";
import { useProviderServices } from "@/hooks/useProviderServices";
import { formatCurrency } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  monthly_price: z.number().min(1, "Preço deve ser maior que zero"),
  included_services_count: z.number().min(1, "Deve incluir pelo menos 1 serviço"),
  enabled_service_ids: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  commission_percentage: z.number().min(0).max(100, "Comissão deve estar entre 0% e 100%"),
});

type FormData = z.infer<typeof formSchema>;

interface SubscriptionPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: any;
}

export default function SubscriptionPlanModal({
  open,
  onOpenChange,
  plan,
}: SubscriptionPlanModalProps) {
  const [loading, setLoading] = useState(false);
  const { createPlan, updatePlan } = useProviderSubscriptionPlans();
  const { allServices } = useProviderServices();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      monthly_price: 0,
      included_services_count: 1,
      enabled_service_ids: [],
      commission_percentage: 50,
    },
  });

  const watchedValues = form.watch();
  const commissionAmount = (watchedValues.monthly_price * watchedValues.commission_percentage) / 100;
  const netAmount = watchedValues.monthly_price - commissionAmount;

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        description: plan.description || "",
        monthly_price: Number(plan.monthly_price),
        included_services_count: plan.included_services_count,
        enabled_service_ids: plan.enabled_service_ids || [],
        commission_percentage: plan.commission_percentage,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        monthly_price: 0,
        included_services_count: 1,
        enabled_service_ids: [],
        commission_percentage: 50,
      });
    }
  }, [plan, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      if (plan) {
        await updatePlan(plan.id, data as any);
      } else {
        await createPlan(data as any);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving plan:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? "Editar Plano" : "Novo Plano de Assinatura"}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes do seu plano de assinatura
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
                name="monthly_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mensal (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o que este plano oferece..."
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
                name="included_services_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. Serviços Inclusos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Quantos serviços o cliente pode usar por mês
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sua Comissão (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentual que você receberá de cada assinatura
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="enabled_service_ids"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">
                      Serviços Habilitados no Plano
                    </FormLabel>
                    <FormDescription>
                      Selecione quais serviços estão inclusos neste plano
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {allServices.map((service) => (
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

            {/* Preview da comissão */}
            {watchedValues.monthly_price > 0 && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Resumo Financeiro:</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Valor Total:</span>
                    <div className="font-bold">{formatCurrency(watchedValues.monthly_price)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sua Comissão:</span>
                    <div className="font-bold text-green-600">
                      {formatCurrency(commissionAmount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Para Barbearia:</span>
                    <div className="font-bold">{formatCurrency(netAmount)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : plan ? "Atualizar" : "Criar Plano"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}