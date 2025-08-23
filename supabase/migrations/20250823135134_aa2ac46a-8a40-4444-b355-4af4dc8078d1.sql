-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'order' CHECK (applies_to IN ('order', 'specific_items')),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(barbershop_id, code)
);

-- Create coupon_applicable_items table
CREATE TABLE public.coupon_applicable_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('service', 'product')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupon_redemptions table
CREATE TABLE public.coupon_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL,
  barbershop_id UUID NOT NULL,
  command_id UUID,
  sale_id UUID,
  client_id UUID,
  discount_amount NUMERIC NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add coupon_code to commands table (skip if already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commands' AND column_name='coupon_code') THEN
    ALTER TABLE public.commands ADD COLUMN coupon_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='commands' AND column_name='discount_amount') THEN
    ALTER TABLE public.commands ADD COLUMN discount_amount NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Add coupon_code to sales table (skip discount_amount since it exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='coupon_code') THEN
    ALTER TABLE public.sales ADD COLUMN coupon_code TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_applicable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
CREATE POLICY "Users can view coupons in their barbershop" 
ON public.coupons 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can create coupons" 
ON public.coupons 
FOR INSERT 
WITH CHECK (barbershop_id = get_user_barbershop_id() AND is_user_admin());

CREATE POLICY "Admins can update coupons" 
ON public.coupons 
FOR UPDATE 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

CREATE POLICY "Admins can delete coupons" 
ON public.coupons 
FOR DELETE 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- RLS Policies for coupon_applicable_items
CREATE POLICY "Users can view coupon items in their barbershop" 
ON public.coupon_applicable_items 
FOR SELECT 
USING (coupon_id IN (
  SELECT id FROM public.coupons WHERE barbershop_id = get_user_barbershop_id()
));

CREATE POLICY "Admins can manage coupon items" 
ON public.coupon_applicable_items 
FOR ALL 
USING (coupon_id IN (
  SELECT id FROM public.coupons WHERE barbershop_id = get_user_barbershop_id() AND is_user_admin()
));

-- RLS Policies for coupon_redemptions
CREATE POLICY "Users can view redemptions from their barbershop" 
ON public.coupon_redemptions 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "System can create redemptions" 
ON public.coupon_redemptions 
FOR INSERT 
WITH CHECK (barbershop_id = get_user_barbershop_id());

-- Create update trigger for coupons
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();