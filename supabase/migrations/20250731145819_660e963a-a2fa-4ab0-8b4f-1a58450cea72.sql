-- SECURITY FIXES MIGRATION - Phase 2: Function Security Only
-- Fix search_path in functions and add enhanced security functions

-- Fix create_command_for_appointment function
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

-- Fix validate_appointment_times function
CREATE OR REPLACE FUNCTION public.validate_appointment_times()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    service_duration integer := 30; -- duração padrão em minutos
BEGIN
    -- Buscar duração do serviço se fornecido
    IF NEW.service_id IS NOT NULL THEN
        SELECT duration_minutes INTO service_duration
        FROM public.services 
        WHERE id = NEW.service_id;
        
        -- Se não encontrar duração, usar padrão
        IF service_duration IS NULL THEN
            service_duration := 30;
        END IF;
    END IF;
    
    -- Se end_time não for fornecido ou for inválido, calcular automaticamente
    IF NEW.end_time IS NULL OR NEW.end_time <= NEW.start_time THEN
        NEW.end_time := (NEW.start_time + (service_duration || ' minutes')::interval)::time;
    END IF;
    
    -- Garantir que end_time seja sempre posterior ao start_time
    IF NEW.end_time <= NEW.start_time THEN
        RAISE EXCEPTION 'End time must be after start time. Start: %, End: %', NEW.start_time, NEW.end_time;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix create_whatsapp_instance_for_barbershop function
CREATE OR REPLACE FUNCTION public.create_whatsapp_instance_for_barbershop()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  instance_name text;
  webhook_url text;
BEGIN
  -- Generate instance name based on barbershop slug
  instance_name := LOWER(REGEXP_REPLACE(NEW.slug, '[^a-zA-Z0-9]', '', 'g'));
  webhook_url := 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook';
  
  -- Insert WhatsApp instance for the new barbershop with more complete data
  INSERT INTO public.whatsapp_instances (
    barbershop_id,
    api_type,
    evolution_instance_name,
    webhook_url,
    auto_created,
    status,
    business_name,
    auto_reply,
    auto_reply_message,
    notification_settings
  ) VALUES (
    NEW.id,
    'evolution',
    instance_name,
    webhook_url,
    true,
    'disconnected',
    NEW.name, -- Use barbershop name as business name
    false,
    'Olá! Obrigado por entrar em contato. Em breve responderemos sua mensagem.',
    '{
      "appointment_confirmation": true,
      "appointment_reminder": true,
      "appointment_cancellation": true
    }'::jsonb
  );
  
  -- Log the creation for debugging
  RAISE NOTICE 'WhatsApp instance created for barbershop: % with name: %', NEW.name, instance_name;
  
  RETURN NEW;
END;
$function$;

-- Fix configure_auto_created_whatsapp_instance function
CREATE OR REPLACE FUNCTION public.configure_auto_created_whatsapp_instance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  barbershop_record record;
BEGIN
  -- Só processar se for uma instância auto-criada e ainda não configurada
  IF NEW.auto_created = true AND NEW.instance_id IS NULL AND NEW.instance_token IS NULL THEN
    -- Buscar dados da barbearia
    SELECT * INTO barbershop_record 
    FROM public.barbershops 
    WHERE id = NEW.barbershop_id;
    
    IF FOUND THEN
      -- Log para debugging
      RAISE NOTICE 'Auto-configuring WhatsApp instance for barbershop: %', barbershop_record.name;
      
      -- Aqui tentaremos chamar a função evolution-instance-manager via HTTP
      -- Como não podemos fazer chamadas HTTP diretas no trigger, vamos usar uma abordagem diferente
      -- Vamos atualizar o status para indicar que precisa ser configurado
      UPDATE public.whatsapp_instances 
      SET 
        status = 'pending_configuration',
        updated_at = now()
      WHERE id = NEW.id;
      
      RAISE NOTICE 'WhatsApp instance marked for configuration: %', NEW.evolution_instance_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix process_pending_whatsapp_configurations function
CREATE OR REPLACE FUNCTION public.process_pending_whatsapp_configurations()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  pending_instance record;
  configured_count int := 0;
BEGIN
  -- Buscar instâncias que precisam ser configuradas
  FOR pending_instance IN 
    SELECT wi.*, b.name as barbershop_name, b.slug as barbershop_slug
    FROM public.whatsapp_instances wi
    JOIN public.barbershops b ON wi.barbershop_id = b.id
    WHERE wi.status = 'pending_configuration' 
    AND wi.auto_created = true
  LOOP
    -- Log para debugging
    RAISE NOTICE 'Processing pending configuration for: %', pending_instance.evolution_instance_name;
    
    -- Aqui você pode adicionar lógica adicional se necessário
    -- Por enquanto, vamos apenas marcar como pronto para configuração manual
    UPDATE public.whatsapp_instances 
    SET 
      status = 'disconnected',
      updated_at = now()
    WHERE id = pending_instance.id;
    
    configured_count := configured_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Processed % pending WhatsApp configurations', configured_count;
  RETURN configured_count;
END;
$function$;

-- Fix set_command_number function
CREATE OR REPLACE FUNCTION public.set_command_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NEW.command_number IS NULL THEN
    NEW.command_number = public.generate_command_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix generate_command_number function
CREATE OR REPLACE FUNCTION public.generate_command_number()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN nextval('public.command_number_seq');
END;
$function$;

-- Enhanced Security Functions

-- Secure super admin creation function with better validation
CREATE OR REPLACE FUNCTION public.create_super_admin_secure(user_email text, user_full_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  user_record record;
  super_admin_id uuid;
BEGIN
  -- Only existing super admins can create new super admins
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: Only super admins can create super admins';
  END IF;
  
  -- Validate input
  IF user_email IS NULL OR user_full_name IS NULL OR 
     user_email = '' OR user_full_name = '' THEN
    RAISE EXCEPTION 'Email and full name are required';
  END IF;
  
  -- Enhanced email validation
  IF NOT public.validate_email(user_email) THEN
    RAISE EXCEPTION 'Invalid email format provided';
  END IF;
  
  -- Find the user by email
  SELECT id INTO user_record FROM auth.users WHERE email = user_email;
  
  IF user_record.id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Check if already a super admin
  IF EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = user_record.id) THEN
    RAISE EXCEPTION 'User is already a super admin';
  END IF;
  
  -- Insert into super_admins table
  INSERT INTO public.super_admins (user_id, full_name, email)
  VALUES (user_record.id, user_full_name, user_email)
  RETURNING id INTO super_admin_id;
  
  -- Log the creation with enhanced details
  INSERT INTO public.audit_logs (
    action,
    target_type,
    target_id,
    details,
    super_admin_id
  ) VALUES (
    'super_admin_created',
    'super_admin',
    super_admin_id,
    jsonb_build_object(
      'created_user_email', user_email,
      'created_user_id', user_record.id,
      'created_by', auth.uid(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    ),
    (SELECT id FROM public.super_admins WHERE user_id = auth.uid())
  );
  
  RETURN super_admin_id;
END;
$function$;

-- Enhanced audit trigger for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Log role changes to audit table with enhanced details
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_logs (
      action,
      target_type,
      target_id,
      details,
      super_admin_id
    ) VALUES (
      'role_change',
      'profile',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user_id', NEW.user_id,
        'target_email', NEW.email,
        'changed_by', auth.uid(),
        'timestamp', now(),
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
      ),
      -- Try to get super admin ID if current user is super admin
      (SELECT id FROM public.super_admins WHERE user_id = auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Enhanced client data validation
CREATE OR REPLACE FUNCTION public.validate_client_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Validate phone format
  IF NEW.phone IS NOT NULL AND NOT public.validate_phone(NEW.phone) THEN
    RAISE EXCEPTION 'Invalid phone format. Use: (XX) XXXXX-XXXX';
  END IF;
  
  -- Validate email format
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NOT public.validate_email(NEW.email) THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Enhanced input sanitization
  NEW.name := TRIM(REGEXP_REPLACE(NEW.name, '[<>"\'';&]', '', 'g'));
  NEW.notes := TRIM(REGEXP_REPLACE(COALESCE(NEW.notes, ''), '[<>"\'';&]', '', 'g'));
  
  -- Validate name length
  IF LENGTH(NEW.name) < 2 OR LENGTH(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add trigger for role change auditing
DROP TRIGGER IF EXISTS audit_profile_role_changes ON public.profiles;
CREATE TRIGGER audit_profile_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();

-- Add trigger for client data validation
DROP TRIGGER IF EXISTS validate_client_data_trigger ON public.clients;
CREATE TRIGGER validate_client_data_trigger
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_client_data();