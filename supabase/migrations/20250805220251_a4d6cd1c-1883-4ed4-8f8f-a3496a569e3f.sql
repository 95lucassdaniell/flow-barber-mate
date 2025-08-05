-- Criar foreign key constraint entre subscription_financial_records e client_subscriptions
ALTER TABLE public.subscription_financial_records 
ADD CONSTRAINT fk_subscription_financial_records_subscription_id 
FOREIGN KEY (subscription_id) REFERENCES public.client_subscriptions(id) 
ON DELETE CASCADE;