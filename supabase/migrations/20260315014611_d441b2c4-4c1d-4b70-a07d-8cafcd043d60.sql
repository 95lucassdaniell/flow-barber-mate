
-- ==========================================
-- MIGRATION 1: Core Tables
-- ==========================================

-- 1. barbershops
CREATE TABLE public.barbershops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  opening_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"18:00"},"tuesday":{"open":"09:00","close":"18:00"},"wednesday":{"open":"09:00","close":"18:00"},"thursday":{"open":"09:00","close":"18:00"},"friday":{"open":"09:00","close":"18:00"},"saturday":{"open":"09:00","close":"13:00"},"sunday":{"open":"","close":""}}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read barbershops" ON public.barbershops FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert barbershops" ON public.barbershops FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners can update their barbershops" ON public.barbershops FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- 2. profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'barber' CHECK (role IN ('admin', 'receptionist', 'barber')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  commission_rate NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT DEFAULT 'active',
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read profiles in their barbershop" ON public.profiles FOR SELECT TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update profiles in their barbershop" ON public.profiles FOR UPDATE TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 3. clients
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  notes TEXT,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read clients in their barbershop" ON public.clients FOR SELECT TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can insert clients in their barbershop" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can update clients in their barbershop" ON public.clients FOR UPDATE TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Users can delete clients in their barbershop" ON public.clients FOR DELETE TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Anon can read clients for booking" ON public.clients FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert clients for booking" ON public.clients FOR INSERT TO anon WITH CHECK (true);

-- 4. services
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Auth users can insert services" ON public.services FOR INSERT TO authenticated
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Auth users can update services" ON public.services FOR UPDATE TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Auth users can delete services" ON public.services FOR DELETE TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 5. appointments
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  booking_source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read appointments in their barbershop" ON public.appointments FOR SELECT TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Anyone can insert appointments (booking)" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth users can update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Auth users can delete appointments" ON public.appointments FOR DELETE TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

-- 6. products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  barcode TEXT,
  cost_price NUMERIC DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  supplier TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  commission_rate NUMERIC DEFAULT 0,
  commission_type TEXT DEFAULT 'percentage',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can read products" ON public.products FOR SELECT TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Auth users can insert products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Auth users can update products" ON public.products FOR UPDATE TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
CREATE POLICY "Auth users can delete products" ON public.products FOR DELETE TO authenticated
  USING (barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid()));
