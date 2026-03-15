
-- Add missing columns to barbershops for super admin features
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'active';
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS monthly_revenue NUMERIC DEFAULT 0;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS trial_start_date DATE;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS trial_end_date DATE;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS subscription_start_date DATE;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS total_users INTEGER DEFAULT 0;
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS total_appointments INTEGER DEFAULT 0;

-- Add missing columns to whatsapp_templates
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS variables TEXT[] DEFAULT '{}';
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to whatsapp_automations  
ALTER TABLE public.whatsapp_automations ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.whatsapp_automations ADD COLUMN IF NOT EXISTS message_template TEXT;

-- Create get_financial_overview RPC
CREATE OR REPLACE FUNCTION public.get_financial_overview()
RETURNS TABLE (
  total_active_accounts BIGINT,
  total_trial_accounts BIGINT,
  total_overdue_accounts BIGINT,
  total_cancelled_accounts BIGINT,
  monthly_revenue NUMERIC,
  annual_revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE b.payment_status = 'active')::BIGINT as total_active_accounts,
    COUNT(*) FILTER (WHERE b.payment_status = 'trial')::BIGINT as total_trial_accounts,
    COUNT(*) FILTER (WHERE b.payment_status = 'overdue')::BIGINT as total_overdue_accounts,
    COUNT(*) FILTER (WHERE b.payment_status = 'cancelled')::BIGINT as total_cancelled_accounts,
    COALESCE(SUM(b.monthly_revenue), 0) as monthly_revenue,
    COALESCE(SUM(b.monthly_revenue) * 12, 0) as annual_revenue
  FROM public.barbershops b;
END;
$$;
