import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SubscriptionValidationResult {
  isValid: boolean;
  subscription?: {
    id: string;
    remaining_services: number;
    plan_name: string;
    provider_name: string;
  };
  canUseService: boolean;
  originalPrice: number;
  discountedPrice: number;
  message: string;
}

export function useSubscriptionValidation() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateServiceUsage = async (
    clientId: string,
    providerId: string,
    serviceId: string,
    originalPrice: number
  ): Promise<SubscriptionValidationResult> => {
    try {
      setLoading(true);
      console.log("Validating subscription for:", { clientId, providerId, serviceId });

      // Validações de entrada
      if (!clientId || !providerId || !serviceId) {
        console.error("Missing required parameters");
        return {
          isValid: false,
          canUseService: false,
          originalPrice,
          discountedPrice: originalPrice,
          message: "Parâmetros obrigatórios não fornecidos",
        };
      }

      // 1. Check for active subscription (usando maybeSingle para evitar erros)
      const { data: subscription, error: subscriptionError } = await supabase
        .from("client_subscriptions")
        .select("id, remaining_services, plan_id, provider_id, client_id, barbershop_id, status")
        .eq("client_id", clientId)
        .eq("provider_id", providerId)
        .eq("status", "active")
        .maybeSingle();

      if (subscriptionError) {
        console.error("Error fetching subscription:", subscriptionError);
        return {
          isValid: false,
          canUseService: false,
          originalPrice,
          discountedPrice: originalPrice,
          message: "Erro ao verificar assinatura",
        };
      }

      if (!subscription) {
        console.log("No active subscription found");
        return {
          isValid: false,
          canUseService: false,
          originalPrice,
          discountedPrice: originalPrice,
          message: "Cliente não possui assinatura ativa com este prestador",
        };
      }

      // 2. Get plan details separately
      const { data: plan, error: planError } = await supabase
        .from("provider_subscription_plans")
        .select("name, enabled_service_ids, included_services_count")
        .eq("id", subscription.plan_id)
        .maybeSingle();

      if (planError || !plan) {
        console.error("Error fetching plan:", planError);
        return {
          isValid: false,
          canUseService: false,
          originalPrice,
          discountedPrice: originalPrice,
          message: "Erro ao verificar plano de assinatura",
        };
      }

      // 3. Get provider details separately
      const { data: provider, error: providerError } = await supabase
        .from("profiles")
        .select("full_name, is_active")
        .eq("id", providerId)
        .maybeSingle();

      if (providerError || !provider) {
        console.error("Error fetching provider:", providerError);
        return {
          isValid: false,
          canUseService: false,
          originalPrice,
          discountedPrice: originalPrice,
          message: "Erro ao verificar prestador",
        };
      }

      // Verificar se o provider está ativo
      if (!provider.is_active) {
        return {
          isValid: false,
          canUseService: false,
          originalPrice,
          discountedPrice: originalPrice,
          message: "Prestador não está ativo",
        };
      }

      // 4. Validar enabled_service_ids com verificações robustas
      let enabledServiceIds: string[] = [];
      
      if (plan.enabled_service_ids) {
        if (Array.isArray(plan.enabled_service_ids)) {
          enabledServiceIds = plan.enabled_service_ids;
        } else if (typeof plan.enabled_service_ids === 'string') {
          try {
            enabledServiceIds = JSON.parse(plan.enabled_service_ids);
          } catch (e) {
            console.error("Error parsing enabled_service_ids:", e);
            enabledServiceIds = [];
          }
        }
      }

      console.log("Enabled service IDs:", enabledServiceIds);
      console.log("Checking service ID:", serviceId);

      // Check if service is included in the plan
      const isServiceIncluded = enabledServiceIds.includes(serviceId);
      
      if (!isServiceIncluded) {
        console.log("Service not included in plan");
        return {
          isValid: true,
          subscription: {
            id: subscription.id,
            remaining_services: subscription.remaining_services,
            plan_name: plan.name,
            provider_name: provider.full_name,
          },
          canUseService: false,
          originalPrice,
          discountedPrice: originalPrice,
          message: "Serviço não incluído no plano de assinatura",
        };
      }

      // Check if there are remaining services
      if (subscription.remaining_services <= 0) {
        console.log("No remaining services");
        return {
          isValid: true,
          subscription: {
            id: subscription.id,
            remaining_services: subscription.remaining_services,
            plan_name: plan.name,
            provider_name: provider.full_name,
          },
          canUseService: false,
          originalPrice,
          discountedPrice: originalPrice,
          message: "Saldo de serviços esgotado no plano de assinatura",
        };
      }

      // Service can be used with subscription discount
      console.log("Service validation successful");
      return {
        isValid: true,
        subscription: {
          id: subscription.id,
          remaining_services: subscription.remaining_services,
          plan_name: plan.name,
          provider_name: provider.full_name,
        },
        canUseService: true,
        originalPrice,
        discountedPrice: 0, // Free for subscription
        message: `Serviço incluído na assinatura (${subscription.remaining_services} restantes)`,
      };

    } catch (err) {
      console.error("Error validating subscription:", err);
      return {
        isValid: false,
        canUseService: false,
        originalPrice,
        discountedPrice: originalPrice,
        message: "Erro interno ao validar assinatura",
      };
    } finally {
      setLoading(false);
    }
  };

  const useSubscriptionService = async (
    subscriptionId: string,
    serviceId: string,
    commandId: string,
    originalPrice: number
  ) => {
    try {
      console.log("Using subscription service:", { subscriptionId, serviceId, commandId });

      // Validações de entrada
      if (!subscriptionId || !serviceId || !commandId) {
        throw new Error("Parâmetros obrigatórios não fornecidos");
      }

      // Get current subscription to decrement safely (usando maybeSingle)
      const { data: currentSub, error: fetchError } = await supabase
        .from("client_subscriptions")
        .select("remaining_services, status, client_id, provider_id, barbershop_id")
        .eq("id", subscriptionId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching current subscription:", fetchError);
        throw new Error("Erro ao buscar assinatura atual");
      }

      if (!currentSub) {
        throw new Error("Assinatura não encontrada");
      }

      if (currentSub.status !== 'active') {
        throw new Error("Assinatura não está ativa");
      }

      if (currentSub.remaining_services <= 0) {
        throw new Error("Não há serviços restantes na assinatura");
      }

      // Decrement remaining services
      const { data: updatedSubscription, error: updateError } = await supabase
        .from("client_subscriptions")
        .update({ 
          remaining_services: Math.max(0, currentSub.remaining_services - 1)
        })
        .eq("id", subscriptionId)
        .select("remaining_services")
        .maybeSingle();

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        throw new Error("Erro ao atualizar assinatura");
      }

      if (!updatedSubscription) {
        throw new Error("Erro ao obter assinatura atualizada");
      }

      // Record usage in history
      const { error: historyError } = await supabase
        .from("subscription_usage_history")
        .insert({
          subscription_id: subscriptionId,
          service_id: serviceId,
          command_id: commandId,
          original_price: originalPrice,
          discounted_price: 0,
        });

      if (historyError) {
        console.error("Error recording usage history:", historyError);
        // Não vamos reverter a transação por isso, apenas log
        console.warn("Failed to record usage history, but subscription was updated");
      }

      toast({
        title: "Serviço utilizado",
        description: `Serviço descontado da assinatura. Restam ${updatedSubscription.remaining_services} serviços.`,
      });

      return updatedSubscription;
    } catch (err) {
      console.error("Error in useSubscriptionService:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao usar serviço da assinatura";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getSubscriptionSummary = async (clientId: string, providerId: string) => {
    try {
      console.log("Getting subscription summary for:", { clientId, providerId });

      if (!clientId || !providerId) {
        console.error("Missing required parameters for subscription summary");
        return null;
      }

      // 1. Get subscription data
      const { data: subscription, error: subscriptionError } = await supabase
        .from("client_subscriptions")
        .select("id, remaining_services, end_date, plan_id, provider_id, status")
        .eq("client_id", clientId)
        .eq("provider_id", providerId)
        .eq("status", "active")
        .maybeSingle();

      if (subscriptionError) {
        console.error("Error fetching subscription summary:", subscriptionError);
        return null;
      }

      if (!subscription) {
        console.log("No active subscription found for summary");
        return null;
      }

      // 2. Get plan details
      const { data: plan, error: planError } = await supabase
        .from("provider_subscription_plans")
        .select("name, monthly_price, included_services_count")
        .eq("id", subscription.plan_id)
        .maybeSingle();

      if (planError) {
        console.error("Error fetching plan for summary:", planError);
        return null;
      }

      // 3. Get provider details
      const { data: provider, error: providerError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", providerId)
        .maybeSingle();

      if (providerError) {
        console.error("Error fetching provider for summary:", providerError);
        return null;
      }

      return {
        id: subscription.id,
        remaining_services: subscription.remaining_services,
        end_date: subscription.end_date,
        plan: plan,
        provider: provider,
      };
    } catch (err) {
      console.error("Error getting subscription summary:", err);
      return null;
    }
  };

  return {
    loading,
    validateServiceUsage,
    useSubscriptionService,
    getSubscriptionSummary,
  };
}