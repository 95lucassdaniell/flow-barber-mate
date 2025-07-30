-- Create whatsapp_templates table
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('appointment', 'marketing', 'reminder', 'confirmation', 'general')),
  trigger_type TEXT CHECK (trigger_type IN ('appointment_created', 'appointment_reminder', 'appointment_confirmation')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_automations table
CREATE TABLE public.whatsapp_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.whatsapp_templates(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('appointment_created', 'appointment_reminder', 'appointment_confirmation')),
  delay_minutes INTEGER DEFAULT 0, -- 0 for immediate, 60 for 1 hour before, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_automation_logs table to track sent messages
CREATE TABLE public.whatsapp_automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES public.whatsapp_automations(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for whatsapp_templates
CREATE POLICY "Users can view templates from their barbershop" 
ON public.whatsapp_templates 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can create templates for their barbershop" 
ON public.whatsapp_templates 
FOR INSERT 
WITH CHECK (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can update templates from their barbershop" 
ON public.whatsapp_templates 
FOR UPDATE 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can delete templates from their barbershop" 
ON public.whatsapp_templates 
FOR DELETE 
USING (barbershop_id = get_user_barbershop_id());

-- Create RLS policies for whatsapp_automations
CREATE POLICY "Users can view automations from their barbershop" 
ON public.whatsapp_automations 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can create automations for their barbershop" 
ON public.whatsapp_automations 
FOR INSERT 
WITH CHECK (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can update automations from their barbershop" 
ON public.whatsapp_automations 
FOR UPDATE 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can delete automations from their barbershop" 
ON public.whatsapp_automations 
FOR DELETE 
USING (barbershop_id = get_user_barbershop_id());

-- Create RLS policies for whatsapp_automation_logs
CREATE POLICY "Users can view automation logs from their barbershop" 
ON public.whatsapp_automation_logs 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can create automation logs for their barbershop" 
ON public.whatsapp_automation_logs 
FOR INSERT 
WITH CHECK (barbershop_id = get_user_barbershop_id());

-- Create triggers for updated_at
CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_automations_updated_at
BEFORE UPDATE ON public.whatsapp_automations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates for appointment management
INSERT INTO public.whatsapp_templates (barbershop_id, name, content, variables, category, trigger_type) 
SELECT 
  b.id,
  'Confirmação de Agendamento',
  'Olá {nome}! Seu agendamento foi confirmado para {data} às {hora} com {barbeiro}. Endereço: {endereco}. Até logo!',
  ARRAY['nome', 'data', 'hora', 'barbeiro', 'endereco'],
  'confirmation',
  'appointment_created'
FROM public.barbershops b;

INSERT INTO public.whatsapp_templates (barbershop_id, name, content, variables, category, trigger_type) 
SELECT 
  b.id,
  'Lembrete de Agendamento',
  'Oi {nome}! Lembrando que você tem agendamento hoje às {hora} com {barbeiro}. Te esperamos! 💈',
  ARRAY['nome', 'hora', 'barbeiro'],
  'reminder',
  'appointment_reminder'
FROM public.barbershops b;

INSERT INTO public.whatsapp_templates (barbershop_id, name, content, variables, category, trigger_type) 
SELECT 
  b.id,
  'Solicitar Confirmação',
  'Oi {nome}! Você tem agendamento amanhã às {hora} com {barbeiro}. Pode confirmar sua presença? Digite SIM para confirmar.',
  ARRAY['nome', 'hora', 'barbeiro'],
  'confirmation',
  'appointment_confirmation'
FROM public.barbershops b;

-- Create default automations
INSERT INTO public.whatsapp_automations (barbershop_id, template_id, trigger_type, delay_minutes) 
SELECT 
  t.barbershop_id,
  t.id,
  'appointment_created',
  0
FROM public.whatsapp_templates t
WHERE t.trigger_type = 'appointment_created';

INSERT INTO public.whatsapp_automations (barbershop_id, template_id, trigger_type, delay_minutes) 
SELECT 
  t.barbershop_id,
  t.id,
  'appointment_reminder',
  60  -- 1 hour before
FROM public.whatsapp_templates t
WHERE t.trigger_type = 'appointment_reminder';

-- Function to replace template variables
CREATE OR REPLACE FUNCTION public.replace_template_variables(
  template_content TEXT,
  appointment_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT := template_content;
  appointment_data RECORD;
BEGIN
  -- Get appointment data with related information
  SELECT 
    a.appointment_date,
    a.appointment_time,
    c.name as client_name,
    c.phone as client_phone,
    p.full_name as barber_name,
    s.name as service_name,
    b.name as barbershop_name,
    b.address as barbershop_address
  INTO appointment_data
  FROM public.appointments a
  JOIN public.clients c ON a.client_id = c.id
  JOIN public.profiles p ON a.barber_id = p.id
  LEFT JOIN public.services s ON a.service_id = s.id
  JOIN public.barbershops b ON a.barbershop_id = b.id
  WHERE a.id = appointment_id;
  
  IF FOUND THEN
    -- Replace variables
    result := REPLACE(result, '{nome}', COALESCE(appointment_data.client_name, ''));
    result := REPLACE(result, '{data}', TO_CHAR(appointment_data.appointment_date, 'DD/MM/YYYY'));
    result := REPLACE(result, '{hora}', appointment_data.appointment_time);
    result := REPLACE(result, '{barbeiro}', COALESCE(appointment_data.barber_name, ''));
    result := REPLACE(result, '{servico}', COALESCE(appointment_data.service_name, ''));
    result := REPLACE(result, '{barbearia}', COALESCE(appointment_data.barbershop_name, ''));
    result := REPLACE(result, '{endereco}', COALESCE(appointment_data.barbershop_address, ''));
  END IF;
  
  RETURN result;
END;
$$;