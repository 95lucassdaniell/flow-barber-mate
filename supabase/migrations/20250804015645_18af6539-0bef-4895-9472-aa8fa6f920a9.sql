-- Create function to safely increment verification attempts
CREATE OR REPLACE FUNCTION public.increment_verification_attempts(
  phone_input text,
  barbershop_id_input uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.phone_verification_codes 
  SET attempts = attempts + 1
  WHERE phone = phone_input 
    AND barbershop_id = barbershop_id_input 
    AND verified = false;
END;
$$;