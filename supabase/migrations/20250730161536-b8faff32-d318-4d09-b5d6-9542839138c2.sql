-- Add missing fields to whatsapp_instances table
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS auto_reply BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_reply_message TEXT DEFAULT 'Olá! Obrigado por entrar em contato. Em breve responderemos sua mensagem.',
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}';

-- Add comment to describe the fields
COMMENT ON COLUMN public.whatsapp_instances.business_name IS 'Business name for WhatsApp messaging';
COMMENT ON COLUMN public.whatsapp_instances.auto_reply IS 'Enable/disable automatic reply';
COMMENT ON COLUMN public.whatsapp_instances.auto_reply_message IS 'Message sent as automatic reply';
COMMENT ON COLUMN public.whatsapp_instances.notification_settings IS 'JSON object containing notification preferences';