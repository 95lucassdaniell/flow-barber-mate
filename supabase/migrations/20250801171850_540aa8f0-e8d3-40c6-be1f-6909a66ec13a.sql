-- Criar tabela para avaliações de clientes
CREATE TABLE public.client_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  barbershop_id UUID NOT NULL,
  barber_id UUID NOT NULL,
  appointment_id UUID,
  nps_score INTEGER NOT NULL CHECK (nps_score >= 0 AND nps_score <= 10),
  rating_stars INTEGER CHECK (rating_stars >= 1 AND rating_stars <= 5),
  review_text TEXT,
  review_type TEXT NOT NULL DEFAULT 'nps',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reviews from their barbershop" 
ON public.client_reviews 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage reviews in their barbershop" 
ON public.client_reviews 
FOR ALL 
USING (
  barbershop_id = get_user_barbershop_id() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'receptionist')
    AND barbershop_id = get_user_barbershop_id()
  )
);

CREATE POLICY "Public can create reviews for active barbershops" 
ON public.client_reviews 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.barbershops 
    WHERE id = client_reviews.barbershop_id 
    AND status = 'active'
  )
  AND EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = client_reviews.client_id 
    AND barbershop_id = client_reviews.barbershop_id
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = client_reviews.barber_id 
    AND barbershop_id = client_reviews.barbershop_id
    AND is_active = true
  )
);

-- Indexes for performance
CREATE INDEX idx_client_reviews_barbershop_id ON public.client_reviews(barbershop_id);
CREATE INDEX idx_client_reviews_client_id ON public.client_reviews(client_id);
CREATE INDEX idx_client_reviews_barber_id ON public.client_reviews(barber_id);
CREATE INDEX idx_client_reviews_created_at ON public.client_reviews(created_at);
CREATE INDEX idx_client_reviews_nps_score ON public.client_reviews(nps_score);

-- Trigger for updated_at
CREATE TRIGGER update_client_reviews_updated_at
BEFORE UPDATE ON public.client_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

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
ON CONFLICT DO NOTHING;