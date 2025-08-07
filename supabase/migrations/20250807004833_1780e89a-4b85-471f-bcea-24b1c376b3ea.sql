-- Última correção de função search_path
-- Verificar e corrigir validate_client_data que pode estar faltando

CREATE OR REPLACE FUNCTION public.validate_client_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Allow "anonymous_visitor" for temporary sessions
  IF NEW.phone IS NOT NULL AND NEW.phone != 'anonymous_visitor' AND NOT public.validate_phone(NEW.phone) THEN
    RAISE EXCEPTION 'Invalid phone format. Use: (XX) XXXXX-XXXX';
  END IF;
  
  -- Validate email format
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NOT public.validate_email(NEW.email) THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Enhanced input sanitization
  NEW.name := TRIM(REGEXP_REPLACE(NEW.name, '[<>"'';&]', '', 'g'));
  NEW.notes := TRIM(REGEXP_REPLACE(COALESCE(NEW.notes, ''), '[<>"'';&]', '', 'g'));
  
  -- Validate name length
  IF LENGTH(NEW.name) < 2 OR LENGTH(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  RETURN NEW;
END;
$function$;