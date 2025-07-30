-- Inserir instância WhatsApp para Barberia Vargas (criada antes do sistema automático)
INSERT INTO public.whatsapp_instances (
  barbershop_id,
  api_type,
  evolution_instance_name,
  webhook_url,
  auto_created,
  status,
  business_name,
  auto_reply,
  auto_reply_message,
  notification_settings
) VALUES (
  '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a',
  'evolution',
  'barbeariavargas',
  'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook',
  true,
  'disconnected',
  'Barberia Vargas',
  false,
  'Olá! Obrigado por entrar em contato. Em breve responderemos sua mensagem.',
  '{
    "appointment_confirmation": true,
    "appointment_reminder": true,
    "appointment_cancellation": true
  }'::jsonb
);