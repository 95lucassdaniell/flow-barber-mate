-- Remover TODAS as políticas existentes das tabelas
DROP POLICY IF EXISTS "Anyone can view barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Anyone can create barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Anyone can update barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Authenticated users can view barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Authenticated users can create barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Admins can update their barbershop" ON public.barbershops;
DROP POLICY IF EXISTS "Users can view their barbershop" ON public.barbershops;
DROP POLICY IF EXISTS "Admins can update their barbershop" ON public.barbershops;

DROP POLICY IF EXISTS "Anyone can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can add team members" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from their barbershop" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can create team profiles" ON public.profiles;

-- Agora criar as políticas corretas para barbershops
CREATE POLICY "Authenticated users can view barbershops" 
ON public.barbershops 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create barbershops" 
ON public.barbershops 
FOR INSERT 
TO authenticated
WITH CHECK (true);

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

-- Políticas corretas para profiles
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

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

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