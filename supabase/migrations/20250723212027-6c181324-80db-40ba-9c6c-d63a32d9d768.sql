-- Corrigir problema de recursão infinita nas políticas RLS
-- Usar funções SECURITY DEFINER para evitar recursão

-- Primeiro, remover as políticas problemáticas
DROP POLICY IF EXISTS "Users can view profiles from their barbershop" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update their barbershop" ON public.barbershops;
DROP POLICY IF EXISTS "Admins can create team profiles" ON public.profiles;

-- Criar função SECURITY DEFINER para obter barbershop_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_barbershop_id()
RETURNS UUID AS $$
  SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Criar função SECURITY DEFINER para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recriar políticas usando as funções para evitar recursão

-- Para profiles - visualização sem recursão
CREATE POLICY "Users can view profiles from their barbershop" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (barbershop_id = public.get_user_barbershop_id());

-- Para barbershops - atualização por admins sem recursão
CREATE POLICY "Admins can update their barbershop" 
ON public.barbershops 
FOR UPDATE 
TO authenticated
USING (public.is_user_admin() AND id = public.get_user_barbershop_id());

-- Para profiles - criação de team members por admins
CREATE POLICY "Admins can create team profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_user_admin() AND barbershop_id = public.get_user_barbershop_id());