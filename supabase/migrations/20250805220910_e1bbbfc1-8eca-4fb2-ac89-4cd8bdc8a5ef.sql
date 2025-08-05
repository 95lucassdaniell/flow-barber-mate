-- Criar foreign key constraint entre client_subscriptions e clients
ALTER TABLE public.client_subscriptions 
ADD CONSTRAINT fk_client_subscriptions_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) 
ON DELETE CASCADE;