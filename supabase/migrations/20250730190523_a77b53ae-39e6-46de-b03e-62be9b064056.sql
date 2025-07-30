-- Create trigger function to automatically send WhatsApp messages when appointment is created
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the whatsapp-automations edge function asynchronously
  PERFORM pg_notify('whatsapp_automation', json_build_object(
    'appointment_id', NEW.id,
    'trigger_type', 'appointment_created'
  )::text);
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire after appointment insert
CREATE TRIGGER appointment_whatsapp_automation
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_whatsapp_automation();