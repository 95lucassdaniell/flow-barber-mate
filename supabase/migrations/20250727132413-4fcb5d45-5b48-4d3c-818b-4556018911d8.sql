-- Drop the existing function first
DROP FUNCTION IF EXISTS public.create_command_for_appointment();

-- Create the improved function that adds the service to the command
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