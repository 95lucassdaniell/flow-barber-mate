-- Corrigir as políticas RLS para funcionar corretamente
-- O problema principal é que as políticas estão muito permissivas
-- Vamos criar políticas mais específicas que permitam o registro mas mantenham a segurança

-- Primeiro, remover todas as políticas permissivas anteriores
DROP POLICY IF EXISTS "Anyone can view barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Anyone can create barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Anyone can update barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Anyone can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update profiles" ON public.profiles;

-- Políticas específicas para barbershops
-- Permitir que usuários autenticados vejam barbershops (necessário para verificar slugs)
CREATE POLICY "Authenticated users can view barbershops" 
ON public.barbershops 
FOR SELECT 
TO authenticated
USING (true);

-- Permitir que usuários autenticados criem barbershops (para registro)
CREATE POLICY "Authenticated users can create barbershops" 
ON public.barbershops 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Permitir que admins atualizem suas barbershops
CREATE POLICY "Admins can update their barbershop" 
ON public.barbershops 
FOR UPDATE 
TO authenticated
USING (
  id IN (
    SELECT barbershop_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Políticas específicas para profiles
-- Permitir que usuários vejam profiles de sua barbearia
CREATE POLICY "Users can view profiles from their barbershop" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  barbershop_id IN (
    SELECT barbershop_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Permitir que usuários autenticados criem seus próprios profiles
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Permitir que usuários atualizem seus próprios profiles
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Permitir que admins criem profiles para outros na mesma barbearia
CREATE POLICY "Admins can create team profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  barbershop_id IN (
    SELECT barbershop_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);