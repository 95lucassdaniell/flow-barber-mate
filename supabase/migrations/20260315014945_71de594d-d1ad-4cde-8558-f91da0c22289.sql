
-- Missing tables

-- subscription_financial_records
CREATE TABLE public.subscription_financial_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.client_subscriptions(id) ON DELETE CASCADE NOT NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'paid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_financial_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD subscription_financial_records" ON public.subscription_financial_records FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- subscription_usage_history
CREATE TABLE public.subscription_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.client_subscriptions(id) ON DELETE CASCADE NOT NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_usage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD subscription_usage_history" ON public.subscription_usage_history FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- commissions
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  command_id UUID REFERENCES public.commands(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD commissions" ON public.commissions FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- coupon_redemptions
CREATE TABLE public.coupon_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  discount_applied NUMERIC NOT NULL DEFAULT 0,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD coupon_redemptions" ON public.coupon_redemptions FOR ALL TO authenticated
  USING (coupon_id IN (SELECT c.id FROM public.coupons c WHERE c.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())))
  WITH CHECK (coupon_id IN (SELECT c.id FROM public.coupons c WHERE c.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())));

-- Add missing columns to cash_register_closures
ALTER TABLE public.cash_register_closures ADD COLUMN IF NOT EXISTS opening_balance NUMERIC DEFAULT 0;
ALTER TABLE public.cash_register_closures ADD COLUMN IF NOT EXISTS total_multiple NUMERIC DEFAULT 0;
ALTER TABLE public.cash_register_closures ADD COLUMN IF NOT EXISTS discrepancy NUMERIC DEFAULT 0;
ALTER TABLE public.cash_register_closures ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;
