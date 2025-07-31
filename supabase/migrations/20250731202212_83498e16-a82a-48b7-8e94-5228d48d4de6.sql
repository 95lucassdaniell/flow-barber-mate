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