-- Criar tabela de planos de assinatura por prestador
CREATE TABLE public.provider_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  barbershop_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price NUMERIC NOT NULL CHECK (monthly_price > 0),
  included_services_count INTEGER NOT NULL DEFAULT 1 CHECK (included_services_count > 0),
  enabled_service_ids UUID[] DEFAULT '{}',
  commission_percentage NUMERIC NOT NULL DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de assinaturas de clientes
CREATE TABLE public.client_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  barbershop_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending_payment')),
  remaining_services INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de histórico de uso de assinaturas
CREATE TABLE public.subscription_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL,
  service_id UUID NOT NULL,
  command_id UUID,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  original_price NUMERIC NOT NULL DEFAULT 0,
  discounted_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de registros financeiros de assinaturas
CREATE TABLE public.subscription_financial_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  barbershop_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.provider_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_financial_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_subscription_plans
CREATE POLICY "Providers can manage their own subscription plans"
ON public.provider_subscription_plans
FOR ALL
USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view subscription plans from their barbershop"
ON public.provider_subscription_plans
FOR SELECT
USING (barbershop_id = get_user_barbershop_id());

-- RLS Policies for client_subscriptions
CREATE POLICY "Admins can manage client subscriptions in their barbershop"
ON public.client_subscriptions
FOR ALL
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

CREATE POLICY "Providers can view their own client subscriptions"
ON public.client_subscriptions
FOR SELECT
USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view client subscriptions from their barbershop"
ON public.client_subscriptions
FOR SELECT
USING (barbershop_id = get_user_barbershop_id());

-- RLS Policies for subscription_usage_history
CREATE POLICY "Users can view subscription usage from their barbershop"
ON public.subscription_usage_history
FOR SELECT
USING (subscription_id IN (
  SELECT id FROM public.client_subscriptions 
  WHERE barbershop_id = get_user_barbershop_id()
));

CREATE POLICY "System can insert subscription usage"
ON public.subscription_usage_history
FOR INSERT
WITH CHECK (subscription_id IN (
  SELECT id FROM public.client_subscriptions 
  WHERE barbershop_id = get_user_barbershop_id()
));

-- RLS Policies for subscription_financial_records
CREATE POLICY "Admins can manage subscription financial records in their barbershop"
ON public.subscription_financial_records
FOR ALL
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

CREATE POLICY "Providers can view their own subscription financial records"
ON public.subscription_financial_records
FOR SELECT
USING (provider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Indexes for better performance
CREATE INDEX idx_provider_subscription_plans_provider_id ON public.provider_subscription_plans(provider_id);
CREATE INDEX idx_provider_subscription_plans_barbershop_id ON public.provider_subscription_plans(barbershop_id);
CREATE INDEX idx_client_subscriptions_client_id ON public.client_subscriptions(client_id);
CREATE INDEX idx_client_subscriptions_provider_id ON public.client_subscriptions(provider_id);
CREATE INDEX idx_client_subscriptions_barbershop_id ON public.client_subscriptions(barbershop_id);
CREATE INDEX idx_client_subscriptions_status ON public.client_subscriptions(status);
CREATE INDEX idx_subscription_usage_history_subscription_id ON public.subscription_usage_history(subscription_id);
CREATE INDEX idx_subscription_financial_records_subscription_id ON public.subscription_financial_records(subscription_id);
CREATE INDEX idx_subscription_financial_records_status ON public.subscription_financial_records(status);

-- Triggers for updated_at
CREATE TRIGGER update_provider_subscription_plans_updated_at
BEFORE UPDATE ON public.provider_subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_subscriptions_updated_at
BEFORE UPDATE ON public.client_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_financial_records_updated_at
BEFORE UPDATE ON public.subscription_financial_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular valor líquido automaticamente
CREATE OR REPLACE FUNCTION public.calculate_subscription_net_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.net_amount = NEW.amount - NEW.commission_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_subscription_net_amount_trigger
BEFORE INSERT OR UPDATE ON public.subscription_financial_records
FOR EACH ROW
EXECUTE FUNCTION public.calculate_subscription_net_amount();

-- Função para reset mensal de serviços
CREATE OR REPLACE FUNCTION public.reset_monthly_subscription_services()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.client_subscriptions 
  SET 
    remaining_services = (
      SELECT included_services_count 
      FROM public.provider_subscription_plans 
      WHERE id = client_subscriptions.plan_id
    ),
    last_reset_date = CURRENT_DATE
  WHERE 
    status = 'active' 
    AND last_reset_date < date_trunc('month', CURRENT_DATE);
END;
$$;

-- Função para processar assinaturas vencidas
CREATE OR REPLACE FUNCTION public.process_overdue_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  processed_count integer := 0;
BEGIN
  -- Marcar assinaturas como vencidas após 5 dias
  UPDATE public.client_subscriptions 
  SET status = 'expired'
  WHERE status = 'active' 
    AND end_date < CURRENT_DATE - INTERVAL '5 days';
    
  GET DIAGNOSTICS processed_count = ROW_COUNT;
  
  -- Marcar registros financeiros como vencidos
  UPDATE public.subscription_financial_records 
  SET status = 'overdue'
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE - INTERVAL '5 days';
    
  RETURN processed_count;
END;
$$;