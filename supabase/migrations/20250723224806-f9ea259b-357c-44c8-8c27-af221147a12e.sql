-- Create whatsapp_instances table for Z-API management
CREATE TABLE public.whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  instance_id TEXT, -- Z-API instance ID
  instance_token TEXT, -- Z-API instance token
  phone_number TEXT, -- Connected WhatsApp number
  status TEXT NOT NULL DEFAULT 'disconnected', -- disconnected, connecting, connected, error
  qr_code TEXT, -- Base64 QR code for connection
  webhook_url TEXT, -- Z-API webhook URL
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(barbershop_id) -- One instance per barbershop
);

-- Create whatsapp_messages table for message history
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  message_id TEXT, -- Z-API message ID
  phone_number TEXT NOT NULL, -- Recipient/sender phone
  contact_name TEXT, -- Contact name
  message_type TEXT NOT NULL DEFAULT 'text', -- text, image, document, audio, etc.
  content JSONB NOT NULL, -- Message content and metadata
  direction TEXT NOT NULL, -- incoming, outgoing
  status TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, read, failed
  client_id UUID REFERENCES public.clients(id), -- Link to client if exists
  appointment_id UUID REFERENCES public.appointments(id), -- Link to appointment if related
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_templates table for message templates
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Template variables like {client_name}, {appointment_time}
  category TEXT NOT NULL DEFAULT 'general', -- appointment, reminder, confirmation, marketing
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_settings table for barbershop WhatsApp configuration
CREATE TABLE public.whatsapp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT,
  auto_reply BOOLEAN NOT NULL DEFAULT false,
  auto_reply_message TEXT,
  business_hours JSONB DEFAULT '{
    "monday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "tuesday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "wednesday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "thursday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "friday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "saturday": {"enabled": true, "start": "09:00", "end": "18:00"},
    "sunday": {"enabled": false, "start": "09:00", "end": "18:00"}
  }'::jsonb,
  notification_settings JSONB DEFAULT '{
    "appointment_confirmation": true,
    "appointment_reminder_24h": true,
    "appointment_reminder_1h": true,
    "appointment_cancellation": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_instances
CREATE POLICY "Users can view instances from their barbershop"
ON public.whatsapp_instances
FOR SELECT
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage instances in their barbershop"
ON public.whatsapp_instances
FOR ALL
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

CREATE POLICY "Super admins can view all instances"
ON public.whatsapp_instances
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can manage all instances"
ON public.whatsapp_instances
FOR ALL
USING (is_super_admin());

-- RLS Policies for whatsapp_messages
CREATE POLICY "Users can view messages from their barbershop"
ON public.whatsapp_messages
FOR SELECT
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can manage messages in their barbershop"
ON public.whatsapp_messages
FOR ALL
USING (barbershop_id = get_user_barbershop_id() AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'receptionist')
  AND barbershop_id = get_user_barbershop_id()
));

-- RLS Policies for whatsapp_templates
CREATE POLICY "Users can view templates from their barbershop"
ON public.whatsapp_templates
FOR SELECT
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage templates in their barbershop"
ON public.whatsapp_templates
FOR ALL
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- RLS Policies for whatsapp_settings
CREATE POLICY "Users can view settings from their barbershop"
ON public.whatsapp_settings
FOR SELECT
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage settings in their barbershop"
ON public.whatsapp_settings
FOR ALL
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at
BEFORE UPDATE ON public.whatsapp_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_settings_updated_at
BEFORE UPDATE ON public.whatsapp_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_instances_barbershop_id ON public.whatsapp_instances(barbershop_id);
CREATE INDEX idx_whatsapp_messages_barbershop_id ON public.whatsapp_messages(barbershop_id);
CREATE INDEX idx_whatsapp_messages_phone_number ON public.whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_templates_barbershop_id ON public.whatsapp_templates(barbershop_id);
CREATE INDEX idx_whatsapp_templates_category ON public.whatsapp_templates(category);
CREATE INDEX idx_whatsapp_settings_barbershop_id ON public.whatsapp_settings(barbershop_id);