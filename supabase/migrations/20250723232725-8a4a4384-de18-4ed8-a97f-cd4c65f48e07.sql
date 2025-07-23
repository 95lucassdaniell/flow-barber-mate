-- Adicionar campos de comissão na tabela produtos
ALTER TABLE public.products 
ADD COLUMN commission_rate DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN commission_type TEXT DEFAULT 'percentage';

-- Adicionar índice para consultas de comissão
CREATE INDEX idx_products_commission ON public.products(commission_type, commission_rate);

-- Adicionar constraint para validar commission_type
ALTER TABLE public.products 
ADD CONSTRAINT check_commission_type 
CHECK (commission_type IN ('percentage', 'fixed'));