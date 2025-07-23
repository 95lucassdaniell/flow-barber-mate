-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'active',
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  monthly_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing_history table
CREATE TABLE public.billing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan_features table
CREATE TABLE public.plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_value TEXT,
  is_enabled BOOLEAN DEFAULT true,
  max_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add financial fields to barbershops table
ALTER TABLE public.barbershops 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Super admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can manage all subscriptions"
ON public.subscriptions
FOR ALL
USING (is_super_admin());

-- RLS Policies for billing_history
CREATE POLICY "Super admins can view all billing history"
ON public.billing_history
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can manage all billing history"
ON public.billing_history
FOR ALL
USING (is_super_admin());

-- RLS Policies for plan_features
CREATE POLICY "Super admins can view all plan features"
ON public.plan_features
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can manage all plan features"
ON public.plan_features
FOR ALL
USING (is_super_admin());

-- Insert default plan features
INSERT INTO public.plan_features (plan_type, feature_name, feature_value, max_limit) VALUES
('trial', 'max_users', 'Limited', 3),
('trial', 'max_appointments_monthly', 'Limited', 50),
('trial', 'whatsapp_integration', 'No', NULL),
('trial', 'support_level', 'Email', NULL),
('basic', 'max_users', 'Limited', 10),
('basic', 'max_appointments_monthly', 'Unlimited', NULL),
('basic', 'whatsapp_integration', 'Yes', NULL),
('basic', 'support_level', 'Email + Chat', NULL),
('premium', 'max_users', 'Unlimited', NULL),
('premium', 'max_appointments_monthly', 'Unlimited', NULL),
('premium', 'whatsapp_integration', 'Yes', NULL),
('premium', 'support_level', 'Priority', NULL),
('premium', 'advanced_reports', 'Yes', NULL),
('enterprise', 'max_users', 'Unlimited', NULL),
('enterprise', 'max_appointments_monthly', 'Unlimited', NULL),
('enterprise', 'whatsapp_integration', 'Yes', NULL),
('enterprise', 'support_level', 'Dedicated', NULL),
('enterprise', 'advanced_reports', 'Yes', NULL),
('enterprise', 'custom_integrations', 'Yes', NULL);

-- Add triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get financial overview
CREATE OR REPLACE FUNCTION public.get_financial_overview()
RETURNS TABLE(
  total_active_accounts INTEGER,
  total_trial_accounts INTEGER,
  total_overdue_accounts INTEGER,
  total_cancelled_accounts INTEGER,
  monthly_revenue NUMERIC,
  annual_revenue NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE payment_status = 'current') AS total_active_accounts,
    COUNT(*) FILTER (WHERE payment_status = 'trial') AS total_trial_accounts,
    COUNT(*) FILTER (WHERE payment_status = 'overdue') AS total_overdue_accounts,
    COUNT(*) FILTER (WHERE payment_status = 'cancelled') AS total_cancelled_accounts,
    COALESCE(SUM(monthly_revenue) FILTER (WHERE payment_status = 'current'), 0) AS monthly_revenue,
    COALESCE(SUM(monthly_revenue) FILTER (WHERE payment_status = 'current'), 0) * 12 AS annual_revenue
  FROM public.barbershops;
$$;