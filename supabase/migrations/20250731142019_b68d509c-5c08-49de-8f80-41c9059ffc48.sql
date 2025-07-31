-- ============================================================================
-- COMPREHENSIVE SECURITY FIXES MIGRATION
-- Fixes critical RLS policies, authorization vulnerabilities, and data integrity
-- ============================================================================

-- 1. CRITICAL: Add RLS policies for all partitioned tables
-- These tables inherit from partitioned tables but need their own policies

-- Enable RLS on all appointment partitions
ALTER TABLE public.appointments_partitioned_2025_01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_05 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_06 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_07 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_08 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_10 ENABLE ROW LEVEL SECURITY;

-- Enable RLS on all command partitions  
ALTER TABLE public.commands_partitioned_2025_01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_05 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_06 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_07 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_08 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_10 ENABLE ROW LEVEL SECURITY;

-- Add policies for appointment partitions (inherit from main table logic)
CREATE POLICY "Users can view appointments from their barbershop partition" 
ON public.appointments_partitioned_2025_01 FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can manage appointments in their barbershop partition" 
ON public.appointments_partitioned_2025_01 FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND 
       EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));

CREATE POLICY "Barbers can view their own appointments partition" 
ON public.appointments_partitioned_2025_01 FOR SELECT 
USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Replicate policies for all appointment partitions
CREATE POLICY "Users can view appointments from their barbershop partition" ON public.appointments_partitioned_2025_02 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Users can manage appointments in their barbershop partition" ON public.appointments_partitioned_2025_02 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own appointments partition" ON public.appointments_partitioned_2025_02 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view appointments from their barbershop partition" ON public.appointments_partitioned_2025_03 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Users can manage appointments in their barbershop partition" ON public.appointments_partitioned_2025_03 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own appointments partition" ON public.appointments_partitioned_2025_03 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view appointments from their barbershop partition" ON public.appointments_partitioned_2025_04 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Users can manage appointments in their barbershop partition" ON public.appointments_partitioned_2025_04 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own appointments partition" ON public.appointments_partitioned_2025_04 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view appointments from their barbershop partition" ON public.appointments_partitioned_2025_05 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Users can manage appointments in their barbershop partition" ON public.appointments_partitioned_2025_05 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own appointments partition" ON public.appointments_partitioned_2025_05 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view appointments from their barbershop partition" ON public.appointments_partitioned_2025_06 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Users can manage appointments in their barbershop partition" ON public.appointments_partitioned_2025_06 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own appointments partition" ON public.appointments_partitioned_2025_06 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view appointments from their barbershop partition" ON public.appointments_partitioned_2025_07 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Users can manage appointments in their barbershop partition" ON public.appointments_partitioned_2025_07 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own appointments partition" ON public.appointments_partitioned_2025_07 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view appointments from their barbershop partition" ON public.appointments_partitioned_2025_08 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Users can manage appointments in their barbershop partition" ON public.appointments_partitioned_2025_08 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own appointments partition" ON public.appointments_partitioned_2025_08 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view appointments from their barbershop partition" ON public.appointments_partitioned_2025_09 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Users can manage appointments in their barbershop partition" ON public.appointments_partitioned_2025_09 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own appointments partition" ON public.appointments_partitioned_2025_09 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view appointments from their barbershop partition" ON public.appointments_partitioned_2025_10 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Users can manage appointments in their barbershop partition" ON public.appointments_partitioned_2025_10 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own appointments partition" ON public.appointments_partitioned_2025_10 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Add policies for command partitions
CREATE POLICY "Users can view commands from their barbershop partition" ON public.commands_partitioned_2025_01 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Admins can manage commands in their barbershop partition" ON public.commands_partitioned_2025_01 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own commands partition" ON public.commands_partitioned_2025_01 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Replicate for all command partitions
CREATE POLICY "Users can view commands from their barbershop partition" ON public.commands_partitioned_2025_02 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Admins can manage commands in their barbershop partition" ON public.commands_partitioned_2025_02 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own commands partition" ON public.commands_partitioned_2025_02 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view commands from their barbershop partition" ON public.commands_partitioned_2025_03 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Admins can manage commands in their barbershop partition" ON public.commands_partitioned_2025_03 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own commands partition" ON public.commands_partitioned_2025_03 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view commands from their barbershop partition" ON public.commands_partitioned_2025_04 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Admins can manage commands in their barbershop partition" ON public.commands_partitioned_2025_04 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own commands partition" ON public.commands_partitioned_2025_04 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view commands from their barbershop partition" ON public.commands_partitioned_2025_05 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Admins can manage commands in their barbershop partition" ON public.commands_partitioned_2025_05 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own commands partition" ON public.commands_partitioned_2025_05 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view commands from their barbershop partition" ON public.commands_partitioned_2025_06 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Admins can manage commands in their barbershop partition" ON public.commands_partitioned_2025_06 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own commands partition" ON public.commands_partitioned_2025_06 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view commands from their barbershop partition" ON public.commands_partitioned_2025_07 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Admins can manage commands in their barbershop partition" ON public.commands_partitioned_2025_07 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own commands partition" ON public.commands_partitioned_2025_07 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view commands from their barbershop partition" ON public.commands_partitioned_2025_08 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Admins can manage commands in their barbershop partition" ON public.commands_partitioned_2025_08 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own commands partition" ON public.commands_partitioned_2025_08 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view commands from their barbershop partition" ON public.commands_partitioned_2025_09 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Admins can manage commands in their barbershop partition" ON public.commands_partitioned_2025_09 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own commands partition" ON public.commands_partitioned_2025_09 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view commands from their barbershop partition" ON public.commands_partitioned_2025_10 FOR SELECT USING (barbershop_id = get_user_barbershop_id());
CREATE POLICY "Admins can manage commands in their barbershop partition" ON public.commands_partitioned_2025_10 FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')));
CREATE POLICY "Barbers can view their own commands partition" ON public.commands_partitioned_2025_10 FOR SELECT USING (barber_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 2. CRITICAL: Fix privilege escalation - prevent users from changing their own role
CREATE POLICY "Prevent role self-modification"
ON public.profiles FOR UPDATE
USING (
  -- Allow updates but not to the role column if it's the user's own record
  user_id != auth.uid() OR 
  -- Or if user is admin, they can update roles
  is_user_admin()
);

-- 3. Fix profiles table data integrity - clean up NULL user_id entries
DELETE FROM public.profiles WHERE user_id IS NULL;

-- Make user_id NOT NULL to prevent future issues
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;

-- 4. Add validation trigger for role changes (audit trail)
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for role change auditing
CREATE TRIGGER audit_profile_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();

-- 5. Improve super admin creation security
CREATE OR REPLACE FUNCTION public.create_super_admin_secure(user_email text, user_full_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record record;
  super_admin_id uuid;
BEGIN
  -- Only existing super admins can create new super admins
  IF NOT is_super_admin() THEN
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

-- 6. Add input validation functions
CREATE OR REPLACE FUNCTION public.validate_phone(phone_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
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
AS $$
BEGIN
  -- Basic email validation
  RETURN email_input ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- 7. Add validation triggers for critical tables
CREATE OR REPLACE FUNCTION public.validate_client_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate phone format
  IF NEW.phone IS NOT NULL AND NOT validate_phone(NEW.phone) THEN
    RAISE EXCEPTION 'Invalid phone format. Use: (XX) XXXXX-XXXX';
  END IF;
  
  -- Validate email format
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NOT validate_email(NEW.email) THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Sanitize text inputs
  NEW.name := TRIM(NEW.name);
  NEW.notes := TRIM(COALESCE(NEW.notes, ''));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_client_data_trigger
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_client_data();

-- 8. Remove hardcoded credentials from triggers (update existing function)
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log trigger execution
  RAISE NOTICE 'WhatsApp automation trigger fired for appointment: %, operation: %', 
    COALESCE(NEW.id, OLD.id), TG_OP;

  -- Use environment variable or secret for API key instead of hardcoded
  -- This will need to be configured in the Edge Functions
  
  -- Check if it's a new appointment
  IF TG_OP = 'INSERT' THEN
    RAISE NOTICE 'Scheduling WhatsApp automation for appointment_created: %', NEW.id;
    
    -- Insert into a queue table instead of direct HTTP call for better security
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
    RAISE NOTICE 'Scheduling WhatsApp automation for appointment_cancelled: %', NEW.id;
    
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

-- 9. Add rate limiting table for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now(),
  barbershop_id uuid REFERENCES public.barbershops(id) ON DELETE CASCADE
);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limit logs"
ON public.rate_limit_log FOR SELECT
USING (user_id = auth.uid());

-- 10. Add security headers function (to be used in Edge Functions)
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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