
-- ==========================================
-- MIGRATION 2: Financial & Commands Tables
-- ==========================================

-- 6. sales
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_time TIME NOT NULL DEFAULT CURRENT_TIME,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'paid',
  cash_register_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD sales in their barbershop" ON public.sales FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 7. sale_items
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'service',
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD sale_items via sales" ON public.sale_items FOR ALL TO authenticated
  USING (sale_id IN (SELECT s.id FROM public.sales s WHERE s.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())))
  WITH CHECK (sale_id IN (SELECT s.id FROM public.sales s WHERE s.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())));

-- 8. expenses
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  payment_date DATE,
  payment_status TEXT DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD expenses in their barbershop" ON public.expenses FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 9. cash_registers
CREATE TABLE public.cash_registers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC DEFAULT 0,
  total_sales NUMERIC DEFAULT 0,
  total_cash NUMERIC DEFAULT 0,
  total_card NUMERIC DEFAULT 0,
  total_pix NUMERIC DEFAULT 0,
  total_multiple NUMERIC DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD cash_registers in their barbershop" ON public.cash_registers FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- Add FK from sales to cash_registers
ALTER TABLE public.sales ADD CONSTRAINT sales_cash_register_id_fkey FOREIGN KEY (cash_register_id) REFERENCES public.cash_registers(id) ON DELETE SET NULL;

-- 10. cash_movements
CREATE TABLE public.cash_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD cash_movements" ON public.cash_movements FOR ALL TO authenticated
  USING (cash_register_id IN (SELECT cr.id FROM public.cash_registers cr WHERE cr.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())))
  WITH CHECK (cash_register_id IN (SELECT cr.id FROM public.cash_registers cr WHERE cr.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())));

-- 11. cash_register_closures
CREATE TABLE public.cash_register_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE CASCADE NOT NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  closed_by UUID REFERENCES auth.users(id),
  total_sales NUMERIC DEFAULT 0,
  total_cash NUMERIC DEFAULT 0,
  total_card NUMERIC DEFAULT 0,
  total_pix NUMERIC DEFAULT 0,
  closing_balance NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_register_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD cash_register_closures" ON public.cash_register_closures FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 12. commands
CREATE TABLE public.commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  command_number TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD commands in their barbershop" ON public.commands FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 13. command_items
CREATE TABLE public.command_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  command_id UUID REFERENCES public.commands(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'service',
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0
);

ALTER TABLE public.command_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD command_items" ON public.command_items FOR ALL TO authenticated
  USING (command_id IN (SELECT c.id FROM public.commands c WHERE c.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())))
  WITH CHECK (command_id IN (SELECT c.id FROM public.commands c WHERE c.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())));

-- 14. coupons
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  applies_to TEXT DEFAULT 'all',
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD coupons in their barbershop" ON public.coupons FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 15. coupon_applicable_items
CREATE TABLE public.coupon_applicable_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL
);

ALTER TABLE public.coupon_applicable_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD coupon_applicable_items" ON public.coupon_applicable_items FOR ALL TO authenticated
  USING (coupon_id IN (SELECT c.id FROM public.coupons c WHERE c.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())))
  WITH CHECK (coupon_id IN (SELECT c.id FROM public.coupons c WHERE c.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())));
