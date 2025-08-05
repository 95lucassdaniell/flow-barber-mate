-- Criar foreign key constraint entre client_subscriptions e provider_subscription_plans
ALTER TABLE public.client_subscriptions 
ADD CONSTRAINT fk_client_subscriptions_plan_id 
FOREIGN KEY (plan_id) REFERENCES public.provider_subscription_plans(id) 
ON DELETE CASCADE;