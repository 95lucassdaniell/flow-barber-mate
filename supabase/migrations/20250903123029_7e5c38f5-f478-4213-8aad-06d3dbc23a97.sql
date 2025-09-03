
-- Add FK so PostgREST can embed whatsapp_templates in whatsapp_automations selects
ALTER TABLE public.whatsapp_automations
  ADD CONSTRAINT whatsapp_automations_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES public.whatsapp_templates(id)
  ON DELETE RESTRICT;

-- Helpful index for lookups/joins
CREATE INDEX IF NOT EXISTS whatsapp_automations_template_id_idx
  ON public.whatsapp_automations(template_id);
