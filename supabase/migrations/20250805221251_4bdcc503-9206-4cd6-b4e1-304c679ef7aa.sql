-- Criar foreign key constraint entre client_subscriptions e profiles (provider_id)
ALTER TABLE public.client_subscriptions 
ADD CONSTRAINT fk_client_subscriptions_provider_id 
FOREIGN KEY (provider_id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;