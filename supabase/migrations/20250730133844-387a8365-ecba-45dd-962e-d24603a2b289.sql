-- Update whatsapp_instances table to support EvolutionAPI
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS api_type text DEFAULT 'evolution';

-- Update existing instances to use evolution as default
UPDATE public.whatsapp_instances 
SET api_type = 'zapi' 
WHERE api_type IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_api_type 
ON public.whatsapp_instances(api_type);

-- Add evolution-specific columns
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS evolution_instance_name text,
ADD COLUMN IF NOT EXISTS auto_created boolean DEFAULT false;

-- Create function to automatically create WhatsApp instance for new barbershops
CREATE OR REPLACE FUNCTION public.create_whatsapp_instance_for_barbershop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert WhatsApp instance for the new barbershop
  INSERT INTO public.whatsapp_instances (
    barbershop_id,
    api_type,
    evolution_instance_name,
    auto_created,
    status
  ) VALUES (
    NEW.id,
    'evolution',
    LOWER(REGEXP_REPLACE(NEW.slug, '[^a-zA-Z0-9]', '', 'g')),
    true,
    'disconnected'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create WhatsApp instances
DROP TRIGGER IF EXISTS create_whatsapp_instance_trigger ON public.barbershops;
CREATE TRIGGER create_whatsapp_instance_trigger
  AFTER INSERT ON public.barbershops
  FOR EACH ROW
  EXECUTE FUNCTION public.create_whatsapp_instance_for_barbershop();