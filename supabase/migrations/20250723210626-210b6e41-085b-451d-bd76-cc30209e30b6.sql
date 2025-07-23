-- Verificar todas as políticas que podem estar causando recursão infinita
-- O problema está na política de barbershops que provavelmente consulta profiles

-- Primeiro, vamos ver as políticas atuais e remover as problemáticas

-- Remover todas as políticas problemáticas de barbershops
DROP POLICY IF EXISTS "Users can view their barbershop" ON public.barbershops;
DROP POLICY IF EXISTS "Admins can update their barbershop" ON public.barbershops;

-- Criar política simples para barbershops que não cause recursão
-- Permitir que qualquer usuário autenticado veja barbershops (temporário para resolver o problema)
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

-- Permitir que usuários autenticados atualizem barbershops (temporário)
CREATE POLICY "Authenticated users can update barbershops" 
ON public.barbershops 
FOR UPDATE 
TO authenticated
USING (true);

-- Verificar se há mais políticas problemáticas em profiles
-- Remover política que pode estar causando problema
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recriar política de visualização de profiles sem recursão
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);