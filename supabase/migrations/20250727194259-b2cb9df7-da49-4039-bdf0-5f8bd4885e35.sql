-- Add RLS policy to allow admins to update profiles in their barbershop
CREATE POLICY "Admins can update team profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_user_admin() AND barbershop_id = get_user_barbershop_id());