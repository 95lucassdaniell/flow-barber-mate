-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS trigger_appointment_whatsapp_automation ON public.appointments;

-- Update the trigger function to use the new whatsapp_automations system
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Handle new appointments (confirmation)
  IF TG_OP = 'INSERT' THEN
    -- Call the whatsapp-automations edge function for appointment confirmation
    PERFORM net.http_post(
      url := 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/whatsapp-automations',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cXdteGZmanVmZWZvY2drZXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5OTk3NSwiZXhwIjoyMDY4ODc1OTc1fQ.LW4rbr_-A7FTzMJcZGP7LJt1kNIiZNuOJKX2qnKXDhY"}'::jsonb,
      body := jsonb_build_object(
        'appointment_id', NEW.id,
        'trigger_type', 'appointment_created'
      )
    );
    RETURN NEW;
  END IF;

  -- Handle appointment cancellations
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Call the whatsapp-automations edge function for appointment cancellation
    PERFORM net.http_post(
      url := 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/whatsapp-automations',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cXdteGZmanVmZWZvY2drZXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5OTk3NSwiZXhwIjoyMDY4ODc1OTc1fQ.LW4rbr_-A7FTzMJcZGP7LJt1kNIiZNuOJKX2qnKXDhY"}'::jsonb,
      body := jsonb_build_object(
        'appointment_id', NEW.id,
        'trigger_type', 'appointment_cancelled'
      )
    );
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create the trigger on appointments table
CREATE TRIGGER trigger_appointment_whatsapp_automation
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_whatsapp_automation();

-- Create a function to schedule WhatsApp reminders
CREATE OR REPLACE FUNCTION public.schedule_whatsapp_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  appointment_record RECORD;
BEGIN
  -- Send 24h reminders for appointments tomorrow
  FOR appointment_record IN
    SELECT a.id
    FROM public.appointments a
    WHERE a.appointment_date = CURRENT_DATE + INTERVAL '1 day'
    AND a.status = 'scheduled'
    AND NOT EXISTS (
      SELECT 1 FROM public.whatsapp_automation_logs wal
      WHERE wal.appointment_id = a.id
      AND wal.trigger_type = 'appointment_reminder_24h'
      AND wal.sent_at::date = CURRENT_DATE
    )
  LOOP
    -- Call the whatsapp-automations edge function for 24h reminder
    PERFORM net.http_post(
      url := 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/whatsapp-automations',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cXdteGZmanVmZWZvY2drZXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5OTk3NSwiZXhwIjoyMDY4ODc1OTc1fQ.LW4rbr_-A7FTzMJcZGP7LJt1kNIiZNuOJKX2qnKXDhY"}'::jsonb,
      body := jsonb_build_object(
        'appointment_id', appointment_record.id,
        'trigger_type', 'appointment_reminder_24h'
      )
    );
  END LOOP;

  -- Send 1h reminders for appointments in 1 hour
  FOR appointment_record IN
    SELECT a.id
    FROM public.appointments a
    WHERE a.appointment_date = CURRENT_DATE
    AND a.start_time BETWEEN (CURRENT_TIME + INTERVAL '1 hour') AND (CURRENT_TIME + INTERVAL '1 hour 30 minutes')
    AND a.status = 'scheduled'
    AND NOT EXISTS (
      SELECT 1 FROM public.whatsapp_automation_logs wal
      WHERE wal.appointment_id = a.id
      AND wal.trigger_type = 'appointment_reminder_1h'
      AND wal.sent_at::date = CURRENT_DATE
    )
  LOOP
    -- Call the whatsapp-automations edge function for 1h reminder
    PERFORM net.http_post(
      url := 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/whatsapp-automations',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cXdteGZmanVmZWZvY2drZXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5OTk3NSwiZXhwIjoyMDY4ODc1OTc1fQ.LW4rbr_-A7FTzMJcZGP7LJt1kNIiZNuOJKX2qnKXDhY"}'::jsonb,
      body := jsonb_build_object(
        'appointment_id', appointment_record.id,
        'trigger_type', 'appointment_reminder_1h'
      )
    );
  END LOOP;
END;
$function$;

-- Schedule the reminder function to run every hour
SELECT cron.schedule(
  'whatsapp-reminders',
  '0 * * * *', -- every hour at minute 0
  $$
  SELECT public.schedule_whatsapp_reminders();
  $$
);