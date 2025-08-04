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

      // Check for active subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from("client_subscriptions")
        .select(`
          id,
          remaining_services,
          plan:provider_subscription_plans(
            name,
            enabled_service_ids,
            included_services_count
          ),
          provider:profiles(full_name)
        `)
        .eq("client_id", clientId)
        .eq("provider_id", providerId)
        .eq("status", "active")
        .single();

      if (subscriptionError) {
        // No active subscription found
        return {
          isValid: false,
          canUseService: false,
          originalPrice,
          discountedPrice: originalPrice,
          message: "Cliente não possui assinatura ativa com este prestador",
        };
      }

      const plan = subscription.plan as any;
      const provider = subscription.provider as any;

      // Check if service is included in the plan
      const isServiceIncluded = plan.enabled_service_ids.includes(serviceId);
      
      if (!isServiceIncluded) {
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
        message: "Erro ao validar assinatura",
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
      // Get current subscription to decrement safely
      const { data: currentSub, error: fetchError } = await supabase
        .from("client_subscriptions")
        .select("remaining_services")
        .eq("id", subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      // Decrement remaining services
      const { data: updatedSubscription, error: updateError } = await supabase
        .from("client_subscriptions")
        .update({ 
          remaining_services: Math.max(0, currentSub.remaining_services - 1)
        })
        .eq("id", subscriptionId)
        .select("remaining_services")
        .single();

      if (updateError) throw updateError;

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

      if (historyError) throw historyError;

      toast({
        title: "Serviço utilizado",
        description: `Serviço descontado da assinatura. Restam ${updatedSubscription.remaining_services} serviços.`,
      });

      return updatedSubscription;
    } catch (err) {
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
      const { data: subscription, error } = await supabase
        .from("client_subscriptions")
        .select(`
          id,
          remaining_services,
          end_date,
          plan:provider_subscription_plans(
            name,
            monthly_price,
            included_services_count
          ),
          provider:profiles(full_name)
        `)
        .eq("client_id", clientId)
        .eq("provider_id", providerId)
        .eq("status", "active")
        .single();

      if (error) return null;

      return {
        id: subscription.id,
        remaining_services: subscription.remaining_services,
        end_date: subscription.end_date,
        plan: subscription.plan,
        provider: subscription.provider,
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