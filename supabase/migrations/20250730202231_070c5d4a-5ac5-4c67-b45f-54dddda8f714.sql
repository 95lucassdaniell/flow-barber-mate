-- First, let's check if the trigger exists and recreate it with proper logging
DROP TRIGGER IF EXISTS trigger_whatsapp_automation_on_appointments ON public.appointments;

-- Recreate the trigger function with better logging
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Log trigger execution
  RAISE NOTICE 'WhatsApp automation trigger fired for appointment: %, operation: %', 
    COALESCE(NEW.id, OLD.id), TG_OP;

  -- Check if it's a new appointment
  IF TG_OP = 'INSERT' THEN
    RAISE NOTICE 'Calling whatsapp-automations function for appointment_created: %', NEW.id;
    
    -- Call the whatsapp-automations edge function directly
    PERFORM
      net.http_post(
        url := 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/whatsapp-automations',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cXdteGZmanVmZWZvY2drZXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5OTk3NSwiZXhwIjoyMDY4ODc1OTc1fQ.fYSFKrI2tn8kUqeoxMdIzh-9OKqlWKTJWJfN0LHN5hA"}'::jsonb,
        body := json_build_object(
          'appointment_id', NEW.id,
          'trigger_type', 'appointment_created'
        )::jsonb
      );
  END IF;

  -- Check if appointment was cancelled
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    RAISE NOTICE 'Calling whatsapp-automations function for appointment_cancelled: %', NEW.id;
    
    PERFORM
      net.http_post(
        url := 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/whatsapp-automations',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cXdteGZmanVmZWZvY2drZXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5OTk3NSwiZXhwIjoyMDY4ODc1OTc1fQ.fYSFKrI2tn8kUqeoxMdIzh-9OKqlWKTJWJfN0LHN5hA"}'::jsonb,
        body := json_build_object(
          'appointment_id', NEW.id,
          'trigger_type', 'appointment_cancelled'
        )::jsonb
      );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create the trigger
CREATE TRIGGER trigger_whatsapp_automation_on_appointments
    AFTER INSERT OR UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_whatsapp_automation();

-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Log that the trigger was created
SELECT 'WhatsApp automation trigger recreated successfully' as status;