-- Corrigir problema de recursão infinita nas políticas RLS
-- O problema é que a política de INSERT verifica a própria tabela profiles
-- mas durante o primeiro registro, o usuário ainda não tem perfil

-- Remover a política problemática
DROP POLICY IF EXISTS "Admins can insert new profiles in their barbershop" ON public.profiles;

-- Criar nova política que permite a criação do primeiro perfil
-- Esta política permite que qualquer usuário autenticado crie UM perfil para si mesmo
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Criar política separada para admins adicionarem outros perfis
CREATE POLICY "Admins can add team members" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id != auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.barbershop_id = barbershop_id 
    AND p.role = 'admin'
  )
);