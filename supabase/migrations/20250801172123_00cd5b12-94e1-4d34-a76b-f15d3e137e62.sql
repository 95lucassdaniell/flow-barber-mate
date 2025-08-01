-- Adicionar coluna template_type na tabela whatsapp_templates se não existir
ALTER TABLE public.whatsapp_templates 
ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'custom';

-- Criar template de WhatsApp para avaliação
INSERT INTO public.whatsapp_templates (
  barbershop_id, 
  name, 
  content, 
  variables, 
  is_active,
  template_type
) 
SELECT 
  b.id,
  'avaliacao_pos_atendimento',
  'Olá {{client_name}}! 👋

Agradecemos pela visita à {{barbershop_name}}! 

Como foi sua experiência hoje com {{barber_name}}? Sua opinião é muito importante para nós! 

👉 Avalie nosso atendimento (0-10): {{evaluation_link}}

Obrigado! 🙏',
  '["client_name", "barbershop_name", "barber_name", "evaluation_link"]',
  true,
  'evaluation'
FROM public.barbershops b
WHERE b.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM public.whatsapp_templates wt 
  WHERE wt.barbershop_id = b.id 
  AND wt.name = 'avaliacao_pos_atendimento'
);