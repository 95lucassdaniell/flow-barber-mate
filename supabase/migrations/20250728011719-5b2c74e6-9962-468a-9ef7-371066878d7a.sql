-- Adicionar campos para senha temporária na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN temporary_password TEXT NULL,
ADD COLUMN password_expires_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN must_change_password BOOLEAN DEFAULT false,
ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE NULL;

-- Criar tabela para metas dos prestadores
CREATE TABLE public.provider_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('service_quantity', 'service_value', 'product_quantity', 'product_value', 'specific_product', 'specific_service')),
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  specific_service_id UUID NULL REFERENCES public.services(id) ON DELETE CASCADE,
  specific_product_id UUID NULL REFERENCES public.products(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Habilitar RLS na tabela provider_goals
ALTER TABLE public.provider_goals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para provider_goals
CREATE POLICY "Admins can manage provider goals in their barbershop" 
ON public.provider_goals 
FOR ALL 
USING (
  barbershop_id = get_user_barbershop_id() 
  AND is_user_admin()
);

CREATE POLICY "Providers can view their own goals" 
ON public.provider_goals 
FOR SELECT 
USING (
  provider_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Função para gerar senha temporária
CREATE OR REPLACE FUNCTION public.generate_temporary_password()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Função para definir senha temporária para um prestador
CREATE OR REPLACE FUNCTION public.set_temporary_password(provider_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  temp_password TEXT;
  provider_record RECORD;
BEGIN
  -- Verificar se o usuário atual é admin da barbearia do prestador
  SELECT p.*, b.id as barbershop_id
  INTO provider_record
  FROM public.profiles p
  JOIN public.barbershops b ON p.barbershop_id = b.id
  WHERE p.id = provider_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider not found';
  END IF;
  
  IF provider_record.barbershop_id != get_user_barbershop_id() OR NOT is_user_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Gerar senha temporária
  temp_password := generate_temporary_password();
  
  -- Atualizar o prestador com a senha temporária
  UPDATE public.profiles
  SET 
    temporary_password = temp_password,
    password_expires_at = now() + INTERVAL '30 days',
    must_change_password = true
  WHERE id = provider_id;
  
  RETURN temp_password;
END;
$$;

-- Trigger para atualizar updated_at na tabela provider_goals
CREATE TRIGGER update_provider_goals_updated_at
BEFORE UPDATE ON public.provider_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_provider_goals_provider_id ON public.provider_goals(provider_id);
CREATE INDEX idx_provider_goals_barbershop_id ON public.provider_goals(barbershop_id);
CREATE INDEX idx_provider_goals_period ON public.provider_goals(period_start, period_end);
CREATE INDEX idx_profiles_temporary_password ON public.profiles(temporary_password) WHERE temporary_password IS NOT NULL;