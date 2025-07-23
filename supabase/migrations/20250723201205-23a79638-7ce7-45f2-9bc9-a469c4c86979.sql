-- Criar tabela de barbearias
CREATE TABLE public.barbershops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  opening_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"18:00"},"tuesday":{"open":"09:00","close":"18:00"},"wednesday":{"open":"09:00","close":"18:00"},"thursday":{"open":"09:00","close":"18:00"},"friday":{"open":"09:00","close":"18:00"},"saturday":{"open":"09:00","close":"18:00"},"sunday":{"open":"09:00","close":"18:00"}}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'barber' CHECK (role IN ('admin', 'receptionist', 'barber')),
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de serviços
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  birth_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para barbershops
CREATE POLICY "Users can view their barbershop" 
ON public.barbershops 
FOR SELECT 
USING (id IN (SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update their barbershop" 
ON public.barbershops 
FOR UPDATE 
USING (id IN (SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas RLS para profiles
CREATE POLICY "Users can view profiles from their barbershop" 
ON public.profiles 
FOR SELECT 
USING (barbershop_id IN (SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can insert new profiles in their barbershop" 
ON public.profiles 
FOR INSERT 
WITH CHECK (barbershop_id IN (SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Políticas RLS para services
CREATE POLICY "Users can view services from their barbershop" 
ON public.services 
FOR SELECT 
USING (barbershop_id IN (SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage services in their barbershop" 
ON public.services 
FOR ALL 
USING (barbershop_id IN (SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));

-- Políticas RLS para clients
CREATE POLICY "Users can view clients from their barbershop" 
ON public.clients 
FOR SELECT 
USING (barbershop_id IN (SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage clients in their barbershop" 
ON public.clients 
FOR ALL 
USING (barbershop_id IN (SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));

-- Políticas RLS para appointments
CREATE POLICY "Users can view appointments from their barbershop" 
ON public.appointments 
FOR SELECT 
USING (barbershop_id IN (SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Barbers can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (barber_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage appointments in their barbershop" 
ON public.appointments 
FOR ALL 
USING (barbershop_id IN (SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));

CREATE POLICY "Barbers can update their own appointments" 
ON public.appointments 
FOR UPDATE 
USING (barber_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_barbershops_updated_at
  BEFORE UPDATE ON public.barbershops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_barbershop_id ON public.profiles(barbershop_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_barber_id ON public.appointments(barber_id);
CREATE INDEX idx_appointments_barbershop_id ON public.appointments(barbershop_id);
CREATE INDEX idx_clients_barbershop_id ON public.clients(barbershop_id);
CREATE INDEX idx_services_barbershop_id ON public.services(barbershop_id);