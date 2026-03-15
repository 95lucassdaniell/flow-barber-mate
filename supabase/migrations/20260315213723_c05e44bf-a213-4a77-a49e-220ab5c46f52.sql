-- Helper functions to avoid recursive RLS on profiles
CREATE OR REPLACE FUNCTION public.get_current_user_barbershop_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.barbershop_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_barbershop_admin(_barbershop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.barbershop_id = _barbershop_id
      AND p.role = 'admin'
  )
$$;

-- Remove recursive policies on profiles
DROP POLICY IF EXISTS "Users can read profiles in their barbershop" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles in their barbershop" ON public.profiles;

-- Recreate non-recursive profiles policies
CREATE POLICY "Users can read profiles in their barbershop"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR barbershop_id = public.get_current_user_barbershop_id()
);

CREATE POLICY "Users can update profiles in their barbershop"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_barbershop_admin(barbershop_id)
)
WITH CHECK (
  barbershop_id = public.get_current_user_barbershop_id()
);

-- Replace barbershops policy that used recursive subquery on profiles
DROP POLICY IF EXISTS "Admins can update barbershop via profile" ON public.barbershops;

CREATE POLICY "Admins can update barbershop via profile"
ON public.barbershops
FOR UPDATE
TO authenticated
USING (
  public.is_barbershop_admin(id)
)
WITH CHECK (
  public.is_barbershop_admin(id)
);

-- Harden insert policy for barbershops
DROP POLICY IF EXISTS "Authenticated users can insert barbershops" ON public.barbershops;

CREATE POLICY "Authenticated users can insert barbershops"
ON public.barbershops
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);