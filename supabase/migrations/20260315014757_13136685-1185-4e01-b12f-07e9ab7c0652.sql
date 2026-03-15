
-- ==========================================
-- MIGRATION 3: Remaining Tables + RPC Functions
-- ==========================================

-- 16. provider_subscription_plans
CREATE TABLE public.provider_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  included_services_count INTEGER NOT NULL DEFAULT 0,
  enabled_service_ids TEXT[] DEFAULT '{}',
  commission_percentage NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD provider_subscription_plans" ON public.provider_subscription_plans FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 17. client_subscriptions
CREATE TABLE public.client_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.provider_subscription_plans(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  remaining_services INTEGER DEFAULT 0,
  last_reset_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD client_subscriptions" ON public.client_subscriptions FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 18. provider_services
CREATE TABLE public.provider_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD provider_services" ON public.provider_services FOR ALL TO authenticated
  USING (provider_id IN (SELECT p.id FROM public.profiles p WHERE p.barbershop_id IN (SELECT pp.barbershop_id FROM public.profiles pp WHERE pp.user_id = auth.uid())))
  WITH CHECK (provider_id IN (SELECT p.id FROM public.profiles p WHERE p.barbershop_id IN (SELECT pp.barbershop_id FROM public.profiles pp WHERE pp.user_id = auth.uid())));

-- 19. provider_goals
CREATE TABLE public.provider_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  specific_service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  specific_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD provider_goals" ON public.provider_goals FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 20. schedule_blocks
CREATE TABLE public.schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  block_date DATE,
  start_time TIME,
  end_time TIME,
  is_full_day BOOLEAN DEFAULT false,
  recurrence_type TEXT DEFAULT 'none',
  days_of_week INTEGER[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD schedule_blocks" ON public.schedule_blocks FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 21. whatsapp_instances
CREATE TABLE public.whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  instance_name TEXT,
  instance_id TEXT,
  api_key TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'disconnected',
  business_name TEXT,
  auto_reply BOOLEAN DEFAULT false,
  auto_reply_message TEXT,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD whatsapp_instances" ON public.whatsapp_instances FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 22. whatsapp_messages
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT,
  contact_name TEXT,
  content JSONB,
  message_type TEXT DEFAULT 'text',
  direction TEXT DEFAULT 'outgoing',
  status TEXT DEFAULT 'sent',
  message_id TEXT,
  instance_id TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD whatsapp_messages" ON public.whatsapp_messages FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 23. whatsapp_templates
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD whatsapp_templates" ON public.whatsapp_templates FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 24. whatsapp_automations
CREATE TABLE public.whatsapp_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD whatsapp_automations" ON public.whatsapp_automations FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 25. automation_rules
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '{}'::jsonb,
  message_template TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD automation_rules" ON public.automation_rules FOR ALL TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 26. automation_executions
CREATE TABLE public.automation_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  execution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending',
  message_content TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD automation_executions" ON public.automation_executions FOR ALL TO authenticated
  USING (rule_id IN (SELECT r.id FROM public.automation_rules r WHERE r.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())))
  WITH CHECK (rule_id IN (SELECT r.id FROM public.automation_rules r WHERE r.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())));

-- 27. public_client_reviews
CREATE TABLE public.public_client_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name TEXT,
  client_phone TEXT,
  nps_score INTEGER,
  star_rating INTEGER,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.public_client_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert reviews" ON public.public_client_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can read reviews" ON public.public_client_reviews FOR SELECT TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Anon can read reviews for public page" ON public.public_client_reviews FOR SELECT TO anon USING (true);

-- 28. super_admins
CREATE TABLE public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can read super_admins" ON public.super_admins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 29. audit_logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  super_admin_id UUID REFERENCES public.super_admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  target_type TEXT,
  target_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can CRUD audit_logs" ON public.audit_logs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

-- ==========================================
-- RPC Functions
-- ==========================================

-- generate_command_number
CREATE OR REPLACE FUNCTION public.generate_command_number(p_barbershop_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  result TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(command_number AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.commands
  WHERE barbershop_id = p_barbershop_id
    AND command_number ~ '^\d+$';
  
  result := LPAD(next_number::TEXT, 4, '0');
  RETURN result;
END;
$$;

-- set_provider_password
CREATE OR REPLACE FUNCTION public.set_provider_password(provider_user_id UUID, new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's password in auth.users
  UPDATE auth.users SET encrypted_password = crypt(new_password, gen_salt('bf')) WHERE id = provider_user_id;
END;
$$;

-- Update barbershops policy to allow admins to update their barbershop
CREATE POLICY "Admins can update barbershop via profile" ON public.barbershops FOR UPDATE TO authenticated
  USING (id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
