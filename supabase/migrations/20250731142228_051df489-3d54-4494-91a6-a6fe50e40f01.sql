-- ============================================================================
-- PHASE 2: REMAINING SECURITY FIXES
-- Fix remaining RLS and function security issues
-- ============================================================================

-- 1. Enable RLS on remaining partitioned tables that still lack it
ALTER TABLE public.appointments_partitioned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned ENABLE ROW LEVEL SECURITY;

-- Add policies for main partitioned tables
CREATE POLICY "Users can view appointments from their barbershop" 
ON public.appointments_partitioned FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can manage appointments in their barbershop" 
ON public.appointments_partitioned FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND 
       EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));

CREATE POLICY "Barbers can view their own appointments" 
ON public.appointments_partitioned FOR SELECT 
USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view commands from their barbershop" 
ON public.commands_partitioned FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage commands in their barbershop" 
ON public.commands_partitioned FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND 
       EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));

CREATE POLICY "Barbers can view their own commands" 
ON public.commands_partitioned FOR SELECT 
USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 2. Fix function search_path security issues by adding SET search_path
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log role changes to audit table
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
        'changed_by', auth.uid()
      ),
      -- Try to get super admin ID if current user is super admin
      (SELECT id FROM public.super_admins WHERE user_id = auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_super_admin_secure(user_email text, user_full_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
  
  -- Log the creation
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
      'created_by', auth.uid()
    ),
    (SELECT id FROM public.super_admins WHERE user_id = auth.uid())
  );
  
  RETURN super_admin_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_phone(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  -- Brazilian phone validation: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  RETURN phone_input ~ '^\(\d{2}\)\s\d{4,5}-\d{4}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  -- Basic email validation
  RETURN email_input ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_client_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Validate phone format
  IF NEW.phone IS NOT NULL AND NOT public.validate_phone(NEW.phone) THEN
    RAISE EXCEPTION 'Invalid phone format. Use: (XX) XXXXX-XXXX';
  END IF;
  
  -- Validate email format
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NOT public.validate_email(NEW.email) THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Sanitize text inputs
  NEW.name := TRIM(NEW.name);
  NEW.notes := TRIM(COALESCE(NEW.notes, ''));
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    action,
    target_type,
    details,
    super_admin_id
  ) VALUES (
    event_type,
    'security_event',
    details || jsonb_build_object(
      'user_id', auth.uid(),
      'timestamp', now()
    ),
    (SELECT id FROM public.super_admins WHERE user_id = auth.uid())
  );
END;
$$;

-- 3. Update other functions with secure search_path
CREATE OR REPLACE FUNCTION public.replace_template_variables(template_content text, appointment_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  processed_content TEXT;
  appointment_record RECORD;
BEGIN
  -- Buscar dados do agendamento
  SELECT 
    a.*,
    c.name as client_name,
    c.phone as client_phone,
    p.full_name as barber_name,
    s.name as service_name,
    b.name as barbershop_name,
    b.address as barbershop_address
  INTO appointment_record
  FROM public.appointments a
  LEFT JOIN public.clients c ON a.client_id = c.id
  LEFT JOIN public.profiles p ON a.barber_id = p.id
  LEFT JOIN public.services s ON a.service_id = s.id
  LEFT JOIN public.barbershops b ON a.barbershop_id = b.id
  WHERE a.id = appointment_id;

  IF NOT FOUND THEN
    RETURN template_content;
  END IF;

  -- Substituir variáveis
  processed_content := template_content;
  processed_content := REPLACE(processed_content, '{{client_name}}', COALESCE(appointment_record.client_name, ''));
  processed_content := REPLACE(processed_content, '{{barber_name}}', COALESCE(appointment_record.barber_name, ''));
  processed_content := REPLACE(processed_content, '{{service_name}}', COALESCE(appointment_record.service_name, ''));
  processed_content := REPLACE(processed_content, '{{appointment_date}}', TO_CHAR(appointment_record.appointment_date, 'DD/MM/YYYY'));
  processed_content := REPLACE(processed_content, '{{appointment_time}}', TO_CHAR(appointment_record.start_time, 'HH24:MI'));
  processed_content := REPLACE(processed_content, '{{barbershop_name}}', COALESCE(appointment_record.barbershop_name, ''));
  processed_content := REPLACE(processed_content, '{{barbershop_address}}', COALESCE(appointment_record.barbershop_address, ''));
  processed_content := REPLACE(processed_content, '{{total_price}}', COALESCE(appointment_record.total_price::TEXT, '0'));

  RETURN processed_content;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_provider_password(provider_id uuid, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    provider_record RECORD;
    user_exists BOOLEAN;
BEGIN
    -- Verificar se o usuário atual é admin da barbearia do prestador
    SELECT p.*, b.id as barbershop_id
    INTO provider_record
    FROM public.profiles p
    JOIN public.barbershops b ON p.barbershop_id = b.id
    WHERE p.id = provider_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Provider not found';
    END IF;
    
    IF provider_record.barbershop_id != public.get_user_barbershop_id() OR NOT public.is_user_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Verificar se já existe usuário no auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = provider_record.user_id
    ) INTO user_exists;
    
    -- Se não existe usuário no auth.users, criar um
    IF NOT user_exists THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            provider_record.user_id,
            'authenticated',
            'authenticated',
            provider_record.email,
            crypt(new_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            format('{"full_name": "%s", "email": "%s"}', provider_record.full_name, provider_record.email)::jsonb,
            now(),
            now(),
            '',
            '',
            '',
            ''
        );
    ELSE
        -- Se já existe, atualizar a senha
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(new_password, gen_salt('bf')),
            updated_at = now()
        WHERE id = provider_record.user_id;
    END IF;
    
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_temporary_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Remove debug logs from production and clean up the temporary debug function
DROP FUNCTION IF EXISTS public.trigger_whatsapp_automation() CASCADE;

-- Recreate without debug logs and with proper security
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if it's a new appointment
  IF TG_OP = 'INSERT' THEN
    -- Insert into automation queue instead of direct HTTP call
    INSERT INTO public.automation_executions (
      rule_id,
      client_id,
      message_content,
      status
    )
    SELECT 
      ar.id,
      NEW.client_id,
      'appointment_created',
      'pending'
    FROM public.automation_rules ar
    WHERE ar.barbershop_id = NEW.barbershop_id
      AND ar.type = 'appointment_confirmation'
      AND ar.is_active = true;
  END IF;

  -- Check if appointment was cancelled
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO public.automation_executions (
      rule_id,
      client_id,
      message_content,
      status
    )
    SELECT 
      ar.id,
      NEW.client_id,
      'appointment_cancelled',
      'pending'
    FROM public.automation_rules ar
    WHERE ar.barbershop_id = NEW.barbershop_id
      AND ar.type = 'appointment_cancellation'
      AND ar.is_active = true;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;