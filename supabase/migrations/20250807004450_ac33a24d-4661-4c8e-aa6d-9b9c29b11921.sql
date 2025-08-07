-- Corrigir search_path de algumas funções críticas
CREATE OR REPLACE FUNCTION public.validate_appointment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Prevent marking future appointments as completed
  IF NEW.status = 'completed' AND NEW.appointment_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot mark future appointments as completed. Date: %, Current Date: %', NEW.appointment_date, CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_super_admin(user_email text, user_full_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  user_record record;
  super_admin_id uuid;
BEGIN
  -- Find the user by email
  SELECT id INTO user_record FROM auth.users WHERE email = user_email;
  
  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert into super_admins table
  INSERT INTO public.super_admins (user_id, full_name, email)
  VALUES (user_record.id, user_full_name, user_email)
  RETURNING id INTO super_admin_id;
  
  RETURN super_admin_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_command_for_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  command_id uuid;
  service_price numeric := 0;
  barber_commission_rate numeric := 0;
  commission_amount numeric := 0;
BEGIN
  -- Insert the command first
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
  ) RETURNING id INTO command_id;

  -- Get the service price from provider_services (priority) or appointment total_price (fallback)
  SELECT COALESCE(ps.price, NEW.total_price, 0)
  INTO service_price
  FROM public.provider_services ps
  WHERE ps.provider_id = NEW.barber_id 
    AND ps.service_id = NEW.service_id 
    AND ps.is_active = true
  LIMIT 1;

  -- If no price found in provider_services, use appointment total_price
  IF service_price = 0 THEN
    service_price := COALESCE(NEW.total_price, 0);
  END IF;

  -- Get barber commission rate
  SELECT COALESCE(commission_rate, 0)
  INTO barber_commission_rate
  FROM public.profiles
  WHERE id = NEW.barber_id;

  -- Calculate commission amount
  commission_amount := service_price * (barber_commission_rate / 100);

  -- Insert the service as a command item
  IF NEW.service_id IS NOT NULL AND service_price > 0 THEN
    INSERT INTO public.command_items (
      command_id,
      service_id,
      item_type,
      quantity,
      unit_price,
      total_price,
      commission_rate,
      commission_amount
    ) VALUES (
      command_id,
      NEW.service_id,
      'service',
      1,
      service_price,
      service_price,
      barber_commission_rate,
      commission_amount
    );

    -- Update command total
    UPDATE public.commands 
    SET total_amount = service_price
    WHERE id = command_id;
  END IF;

  RETURN NEW;
END;
$function$;