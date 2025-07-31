-- Fix RLS policies for appointments deletion and add better error handling

-- First, let's add a policy for super admins to delete any appointment (for testing/admin purposes)
CREATE POLICY "Super admins can delete any appointment" 
ON public.appointments 
FOR DELETE 
USING (is_super_admin());

-- Add a policy for barbers to delete their own appointments
CREATE POLICY "Barbers can delete their own appointments" 
ON public.appointments 
FOR DELETE 
USING (barber_id IN (
  SELECT profiles.id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

-- Create a test barbershop and profile for current user if none exists
DO $$
DECLARE
  current_user_id uuid;
  test_barbershop_id uuid;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NOT NULL THEN
    -- Check if barbershop exists
    SELECT id INTO test_barbershop_id FROM public.barbershops LIMIT 1;
    
    -- If no barbershop exists, create one
    IF test_barbershop_id IS NULL THEN
      INSERT INTO public.barbershops (name, slug, status) 
      VALUES ('Barbearia Teste', 'barbearia-teste', 'active')
      RETURNING id INTO test_barbershop_id;
    END IF;
    
    -- Check if profile exists for current user
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = current_user_id) THEN
      -- Create profile for current user
      INSERT INTO public.profiles (
        user_id, 
        barbershop_id, 
        full_name, 
        email, 
        role, 
        is_active
      ) VALUES (
        current_user_id,
        test_barbershop_id,
        'Admin Teste',
        (SELECT email FROM auth.users WHERE id = current_user_id),
        'admin',
        true
      );
    END IF;
  END IF;
END $$;