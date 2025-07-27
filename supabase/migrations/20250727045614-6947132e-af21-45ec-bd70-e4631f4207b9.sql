-- Corrigir search_path das funções para segurança
CREATE OR REPLACE FUNCTION public.generate_command_number()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN nextval('public.command_number_seq');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_command_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.command_number IS NULL THEN
    NEW.command_number = public.generate_command_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_command_for_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.commands (
    appointment_id,
    client_id,
    barber_id,
    barbershop_id,
    status
  ) VALUES (
    NEW.id,
    NEW.client_id,
    NEW.barber_id,
    NEW.barbershop_id,
    'open'
  );
  
  RETURN NEW;
END;
$$;