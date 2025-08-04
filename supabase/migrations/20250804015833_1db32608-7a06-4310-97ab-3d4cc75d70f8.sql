-- Create function to reset verification code attempts
CREATE OR REPLACE FUNCTION public.reset_verification_attempts(
  phone_input text,
  barbershop_id_input uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Delete expired codes first
  DELETE FROM public.phone_verification_codes 
  WHERE phone = phone_input 
    AND barbershop_id = barbershop_id_input 
    AND expires_at < now();
  
  -- Reset attempts for remaining codes
  UPDATE public.phone_verification_codes 
  SET attempts = 0
  WHERE phone = phone_input 
    AND barbershop_id = barbershop_id_input 
    AND verified = false;
END;
$$;

-- Create function to cleanup all expired verification codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  DELETE FROM public.phone_verification_codes 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;