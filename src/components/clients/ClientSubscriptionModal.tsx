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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useClientSubscriptions } from "@/hooks/useClientSubscriptions";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

const formSchema = z.object({
  provider_id: z.string().min(1, "Selecione um prestador"),
  plan_id: z.string().min(1, "Selecione um plano"),
  start_date: z.string().min(1, "Data de início é obrigatória"),
});

type FormData = z.infer<typeof formSchema>;

interface ClientSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

interface Provider {
  id: string;
  full_name: string;
  email: string;
}

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  included_services_count: number;
  commission_percentage: number;
  description?: string;
}

export default function ClientSubscriptionModal({
  open,
  onOpenChange,
  clientId,
}: ClientSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const { profile } = useAuth();
  const { createSubscription } = useClientSubscriptions();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider_id: "",
      plan_id: "",
      start_date: new Date().toISOString().split('T')[0],
    },
  });

  const watchedProviderId = form.watch("provider_id");
  const watchedPlanId = form.watch("plan_id");
  const selectedPlan = plans.find(p => p.id === watchedPlanId);

  useEffect(() => {
    if (open && profile?.barbershop_id) {
      fetchProviders();
    }
  }, [open, profile?.barbershop_id]);

  useEffect(() => {
    if (watchedProviderId) {
      setSelectedProvider(watchedProviderId);
      fetchPlans(watchedProviderId);
      form.setValue("plan_id", ""); // Reset plan selection when provider changes
    }
  }, [watchedProviderId, form]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("barbershop_id", profile?.barbershop_id)
        .eq("role", "barber")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setProviders(data || []);
    } catch (err) {
      console.error("Error fetching providers:", err);
    }
  };

  const fetchPlans = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from("provider_subscription_plans")
        .select("*")
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .order("monthly_price");

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error("Error fetching plans:", err);
      setPlans([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      await createSubscription({
        client_id: clientId,
        provider_id: data.provider_id,
        plan_id: data.plan_id,
        start_date: data.start_date,
      });
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error creating subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Assinatura</DialogTitle>
          <DialogDescription>
            Configure uma nova assinatura para o cliente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="provider_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prestador</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um prestador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.full_name}
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
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!selectedProvider}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{plan.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(plan.monthly_price)} • {plan.included_services_count} serviços
                            </span>
                          </div>
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
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPlan && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Resumo do Plano:</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Valor mensal:</span>
                    <span className="font-bold">{formatCurrency(selectedPlan.monthly_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Serviços inclusos:</span>
                    <span>{selectedPlan.included_services_count} por mês</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comissão do prestador:</span>
                    <span>{selectedPlan.commission_percentage}%</span>
                  </div>
                  {selectedPlan.description && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {selectedPlan.description}
                      </p>
                    </div>
                  )}
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
                {loading ? "Criando..." : "Criar Assinatura"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}