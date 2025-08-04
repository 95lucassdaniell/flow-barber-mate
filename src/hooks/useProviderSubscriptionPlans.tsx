import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProviderAuth } from "@/hooks/useProviderAuth";
import { useToast } from "@/hooks/use-toast";

export interface ProviderSubscriptionPlan {
  id: string;
  provider_id: string;
  barbershop_id: string;
  name: string;
  description?: string;
  monthly_price: number;
  included_services_count: number;
  enabled_service_ids: string[];
  commission_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanData {
  name: string;
  description?: string;
  monthly_price: number;
  included_services_count: number;
  enabled_service_ids: string[];
  commission_percentage: number;
}

export function useProviderSubscriptionPlans() {
  const [plans, setPlans] = useState<ProviderSubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProviderAuth();
  const { toast } = useToast();

  const fetchPlans = async () => {
    if (!profile?.id || !profile?.barbershop_id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("provider_subscription_plans")
        .select("*")
        .eq("provider_id", profile.id)
        .eq("barbershop_id", profile.barbershop_id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setPlans(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar planos";
      setError(errorMessage);
      console.error("Error fetching subscription plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: CreatePlanData) => {
    if (!profile?.id || !profile?.barbershop_id) {
      throw new Error("Perfil de prestador não encontrado");
    }

    try {
      const { data, error } = await supabase
        .from("provider_subscription_plans")
        .insert({
          ...planData,
          provider_id: profile.id,
          barbershop_id: profile.barbershop_id,
        })
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => [data, ...prev]);
      toast({
        title: "Plano criado",
        description: "Plano de assinatura criado com sucesso",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar plano";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updatePlan = async (planId: string, updates: Partial<CreatePlanData>) => {
    try {
      const { data, error } = await supabase
        .from("provider_subscription_plans")
        .update(updates)
        .eq("id", planId)
        .eq("provider_id", profile?.id)
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, ...data } : plan
      ));

      toast({
        title: "Plano atualizado",
        description: "Plano de assinatura atualizado com sucesso",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar plano";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from("provider_subscription_plans")
        .update({ is_active: isActive })
        .eq("id", planId)
        .eq("provider_id", profile?.id)
        .select()
        .single();

      if (error) throw error;

      setPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, is_active: isActive } : plan
      ));

      toast({
        title: isActive ? "Plano ativado" : "Plano desativado",
        description: `Plano ${isActive ? "ativado" : "desativado"} com sucesso`,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao alterar status do plano";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      // Check if plan has active subscriptions
      const { data: subscriptions, error: checkError } = await supabase
        .from("client_subscriptions")
        .select("id")
        .eq("plan_id", planId)
        .eq("status", "active");

      if (checkError) throw checkError;

      if (subscriptions && subscriptions.length > 0) {
        throw new Error("Não é possível excluir um plano com assinaturas ativas");
      }

      const { error } = await supabase
        .from("provider_subscription_plans")
        .delete()
        .eq("id", planId)
        .eq("provider_id", profile?.id);

      if (error) throw error;

      setPlans(prev => prev.filter(plan => plan.id !== planId));

      toast({
        title: "Plano excluído",
        description: "Plano de assinatura excluído com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao excluir plano";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    if (profile?.id && profile?.barbershop_id) {
      fetchPlans();
    }
  }, [profile?.id, profile?.barbershop_id]);

  return {
    plans,
    loading,
    error,
    createPlan,
    updatePlan,
    togglePlanStatus,
    deletePlan,
    refetchPlans: fetchPlans,
  };
}