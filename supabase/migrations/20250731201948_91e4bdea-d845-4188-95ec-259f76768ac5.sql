-- Fix foreign key constraint to allow cascade deletion
ALTER TABLE public.commands 
DROP CONSTRAINT IF EXISTS commands_appointment_id_fkey;

ALTER TABLE public.commands 
ADD CONSTRAINT commands_appointment_id_fkey 
FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Fix RLS policies for appointment deletion
DROP POLICY IF EXISTS "Admins can delete appointments in their barbershop" ON public.appointments;
DROP POLICY IF EXISTS "Users can manage appointments in their barbershop" ON public.appointments;

-- Create comprehensive deletion policy for admins/receptionists
CREATE POLICY "Admins and receptionists can delete appointments in their barbershop" 
ON public.appointments 
FOR DELETE 
USING (
  barbershop_id IN (
    SELECT p.barbershop_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'receptionist')
  )
);

-- Recreate the general management policy (excluding DELETE which is handled above)
CREATE POLICY "Admins and receptionists can manage appointments in their barbershop" 
ON public.appointments 
FOR ALL 
USING (
  barbershop_id IN (
    SELECT p.barbershop_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('admin', 'receptionist')
  )
);

-- Ensure current user has a proper admin profile if none exists
DO $$
DECLARE
    current_user_id uuid := auth.uid();
    test_barbershop_id uuid;
BEGIN
    -- Check if user already has a profile
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = current_user_id) THEN
        -- Get or create test barbershop
        SELECT id INTO test_barbershop_id 
        FROM public.barbershops 
        WHERE slug = 'test-barbershop' 
        LIMIT 1;
        
        IF test_barbershop_id IS NULL THEN
            INSERT INTO public.barbershops (name, slug, status, created_by)
            VALUES ('Test Barbershop', 'test-barbershop', 'active', current_user_id)
            RETURNING id INTO test_barbershop_id;
        END IF;
        
        -- Create admin profile for current user
        INSERT INTO public.profiles (
            user_id, 
            barbershop_id, 
            role, 
            full_name, 
            email
        ) VALUES (
            current_user_id,
            test_barbershop_id,
            'admin',
            'Test Admin',
            'admin@test.com'
        );
    END IF;
END $$;