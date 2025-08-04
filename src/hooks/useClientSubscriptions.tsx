import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ClientSubscription {
  id: string;
  client_id: string;
  provider_id: string;
  barbershop_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending_payment';
  remaining_services: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  provider?: {
    id: string;
    full_name: string;
    email: string;
  };
  plan?: {
    id: string;
    name: string;
    monthly_price: number;
    included_services_count: number;
    commission_percentage: number;
  };
}

export interface CreateSubscriptionData {
  client_id: string;
  provider_id: string;
  plan_id: string;
  start_date?: string;
}

export function useClientSubscriptions(clientId?: string) {
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchSubscriptions = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("client_subscriptions")
        .select(`
          *,
          client:clients(id, name, phone, email),
          provider:profiles(id, full_name, email),
          plan:provider_subscription_plans(id, name, monthly_price, included_services_count, commission_percentage)
        `)
        .eq("barbershop_id", profile.barbershop_id)
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setSubscriptions((data as unknown as ClientSubscription[]) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar assinaturas";
      setError(errorMessage);
      console.error("Error fetching subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (subscriptionData: CreateSubscriptionData) => {
    if (!profile?.barbershop_id) {
      throw new Error("Barbearia não encontrada");
    }

    try {
      // Check if client already has active subscription with this provider
      const { data: existingSubscriptions, error: checkError } = await supabase
        .from("client_subscriptions")
        .select("id")
        .eq("client_id", subscriptionData.client_id)
        .eq("provider_id", subscriptionData.provider_id)
        .eq("status", "active");

      if (checkError) throw checkError;

      if (existingSubscriptions && existingSubscriptions.length > 0) {
        throw new Error("Cliente já possui assinatura ativa com este prestador");
      }

      // Get plan details to calculate commission and end date
      const { data: plan, error: planError } = await supabase
        .from("provider_subscription_plans")
        .select("*")
        .eq("id", subscriptionData.plan_id)
        .single();

      if (planError) throw planError;

      const startDate = subscriptionData.start_date || new Date().toISOString().split('T')[0];
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      // Create subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from("client_subscriptions")
        .insert({
          ...subscriptionData,
          barbershop_id: profile.barbershop_id,
          start_date: startDate,
          end_date: endDate.toISOString().split('T')[0],
          remaining_services: plan.included_services_count,
          status: 'active',
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Create financial record
      const commissionAmount = (plan.monthly_price * plan.commission_percentage) / 100;
      
      const { error: financialError } = await supabase
        .from("subscription_financial_records")
        .insert({
          subscription_id: subscription.id,
          provider_id: subscriptionData.provider_id,
          barbershop_id: profile.barbershop_id,
          amount: plan.monthly_price,
          commission_amount: commissionAmount,
          due_date: endDate.toISOString().split('T')[0],
          status: 'pending',
        });

      if (financialError) throw financialError;

      await fetchSubscriptions();

      toast({
        title: "Assinatura criada",
        description: "Assinatura criada com sucesso",
      });

      return subscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar assinatura";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const { data, error } = await supabase
        .from("client_subscriptions")
        .update({ status: 'cancelled' })
        .eq("id", subscriptionId)
        .eq("barbershop_id", profile?.barbershop_id)
        .select()
        .single();

      if (error) throw error;

      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: 'cancelled' } : sub
      ));

      toast({
        title: "Assinatura cancelada",
        description: "Assinatura cancelada com sucesso",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao cancelar assinatura";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const renewSubscription = async (subscriptionId: string) => {
    try {
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      if (!subscription) throw new Error("Assinatura não encontrada");

      const newEndDate = new Date(subscription.end_date);
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      const { data, error } = await supabase
        .from("client_subscriptions")
        .update({ 
          end_date: newEndDate.toISOString().split('T')[0],
          status: 'active'
        })
        .eq("id", subscriptionId)
        .eq("barbershop_id", profile?.barbershop_id)
        .select()
        .single();

      if (error) throw error;

      // Create new financial record for renewal
      if (subscription.plan) {
        const commissionAmount = (subscription.plan.monthly_price * subscription.plan.commission_percentage) / 100;
        
        await supabase
          .from("subscription_financial_records")
          .insert({
            subscription_id: subscriptionId,
            provider_id: subscription.provider_id,
            barbershop_id: profile.barbershop_id,
            amount: subscription.plan.monthly_price,
            commission_amount: commissionAmount,
            due_date: newEndDate.toISOString().split('T')[0],
            status: 'pending',
          });
      }

      await fetchSubscriptions();

      toast({
        title: "Assinatura renovada",
        description: "Assinatura renovada com sucesso",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao renovar assinatura";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getActiveSubscriptionForProvider = (clientId: string, providerId: string) => {
    return subscriptions.find(sub => 
      sub.client_id === clientId && 
      sub.provider_id === providerId && 
      sub.status === 'active'
    );
  };

  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchSubscriptions();
    }
  }, [profile?.barbershop_id, clientId]);

  return {
    subscriptions,
    loading,
    error,
    createSubscription,
    cancelSubscription,
    renewSubscription,
    getActiveSubscriptionForProvider,
    refetchSubscriptions: fetchSubscriptions,
  };
}