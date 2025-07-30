-- Criar tabelas para sistema de automações WhatsApp

-- Tabela de templates de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  category TEXT NOT NULL CHECK (category IN ('appointment_confirmation', 'appointment_reminder', 'appointment_cancellation', 'promotion', 'custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de automações WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('appointment_created', 'appointment_reminder_24h', 'appointment_reminder_1h', 'appointment_cancelled')),
  template_id UUID NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de logs de automações WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL,
  appointment_id UUID,
  automation_id UUID,
  phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_templates
CREATE POLICY "Users can manage templates in their barbershop" 
ON public.whatsapp_templates 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id());

-- Políticas RLS para whatsapp_automations
CREATE POLICY "Users can manage automations in their barbershop" 
ON public.whatsapp_automations 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id());

-- Políticas RLS para whatsapp_automation_logs
CREATE POLICY "Users can view automation logs in their barbershop" 
ON public.whatsapp_automation_logs 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "System can insert automation logs" 
ON public.whatsapp_automation_logs 
FOR INSERT 
WITH CHECK (barbershop_id = get_user_barbershop_id());

-- Função para substituir variáveis nos templates
CREATE OR REPLACE FUNCTION public.replace_template_variables(
  template_content TEXT,
  appointment_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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
  FROM appointments a
  LEFT JOIN clients c ON a.client_id = c.id
  LEFT JOIN profiles p ON a.barber_id = p.id
  LEFT JOIN services s ON a.service_id = s.id
  LEFT JOIN barbershops b ON a.barbershop_id = b.id
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

-- Inserir templates padrão para Barberia Vargas
INSERT INTO public.whatsapp_templates (barbershop_id, name, content, variables, category) VALUES
('9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', 'Confirmação de Agendamento', 
'Olá {{client_name}}! 👋

Seu agendamento foi confirmado com sucesso! ✅

📅 Data: {{appointment_date}}
⏰ Horário: {{appointment_time}}
💇‍♂️ Barbeiro: {{barber_name}}
✂️ Serviço: {{service_name}}
💰 Valor: R$ {{total_price}}

📍 Local: {{barbershop_name}}
{{barbershop_address}}

Aguardamos você! 😊', 
'["client_name", "appointment_date", "appointment_time", "barber_name", "service_name", "total_price", "barbershop_name", "barbershop_address"]'::jsonb, 
'appointment_confirmation'),

('9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', 'Lembrete 24h', 
'Olá {{client_name}}! 👋

Este é um lembrete do seu agendamento para amanhã:

📅 Data: {{appointment_date}}
⏰ Horário: {{appointment_time}}
💇‍♂️ Barbeiro: {{barber_name}}
✂️ Serviço: {{service_name}}

📍 {{barbershop_name}}
{{barbershop_address}}

Confirme sua presença ou entre em contato caso precise remarcar! 😊', 
'["client_name", "appointment_date", "appointment_time", "barber_name", "service_name", "barbershop_name", "barbershop_address"]'::jsonb, 
'appointment_reminder'),

('9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', 'Lembrete 1h', 
'Olá {{client_name}}! 👋

Seu agendamento é em 1 hora! ⏰

📅 Hoje às {{appointment_time}}
💇‍♂️ Com {{barber_name}}
✂️ {{service_name}}

📍 {{barbershop_name}}
{{barbershop_address}}

Já estamos te esperando! 😊', 
'["client_name", "appointment_time", "barber_name", "service_name", "barbershop_name", "barbershop_address"]'::jsonb, 
'appointment_reminder'),

('9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', 'Cancelamento de Agendamento', 
'Olá {{client_name}}! 👋

Seu agendamento foi cancelado:

📅 Data: {{appointment_date}}
⏰ Horário: {{appointment_time}}
💇‍♂️ Barbeiro: {{barber_name}}

Entre em contato conosco para reagendar quando desejar! 😊

{{barbershop_name}}', 
'["client_name", "appointment_date", "appointment_time", "barber_name", "barbershop_name"]'::jsonb, 
'appointment_cancellation');

-- Criar automações padrão para Barberia Vargas
INSERT INTO public.whatsapp_automations (barbershop_id, name, description, trigger_type, template_id, delay_minutes, is_active)
SELECT 
  '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a',
  'Automação - ' || t.name,
  'Envio automático de ' || t.name,
  CASE 
    WHEN t.category = 'appointment_confirmation' THEN 'appointment_created'
    WHEN t.category = 'appointment_reminder' AND t.name LIKE '%24h%' THEN 'appointment_reminder_24h'
    WHEN t.category = 'appointment_reminder' AND t.name LIKE '%1h%' THEN 'appointment_reminder_1h'
    WHEN t.category = 'appointment_cancellation' THEN 'appointment_cancelled'
    ELSE 'appointment_created'
  END,
  t.id,
  0,
  true
FROM public.whatsapp_templates t
WHERE t.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a';

-- Criar trigger para disparo automático das automações
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é um novo agendamento
  IF TG_OP = 'INSERT' THEN
    -- Chamar função de automação para confirmação de agendamento
    PERFORM pg_notify('whatsapp_automation', json_build_object(
      'appointment_id', NEW.id,
      'trigger_type', 'appointment_created'
    )::text);
  END IF;

  -- Verificar se o status mudou para cancelado
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Chamar função de automação para cancelamento
    PERFORM pg_notify('whatsapp_automation', json_build_object(
      'appointment_id', NEW.id,
      'trigger_type', 'appointment_cancelled'
    )::text);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Adicionar trigger na tabela appointments
DROP TRIGGER IF EXISTS trigger_whatsapp_automation ON public.appointments;
CREATE TRIGGER trigger_whatsapp_automation
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_whatsapp_automation();

-- Adicionar triggers de update em todas as tabelas
CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_automations_updated_at
  BEFORE UPDATE ON public.whatsapp_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();