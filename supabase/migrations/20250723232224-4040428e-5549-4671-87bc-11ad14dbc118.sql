-- Criar tabela de produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  barcode TEXT,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER NOT NULL DEFAULT 5,
  supplier TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para produtos
CREATE POLICY "Users can view products from their barbershop"
ON public.products
FOR SELECT
TO authenticated
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage products in their barbershop"
ON public.products
FOR ALL
TO authenticated
USING (
  barbershop_id = get_user_barbershop_id() 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'receptionist')
    AND barbershop_id = get_user_barbershop_id()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_products_barbershop_id ON public.products(barbershop_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_stock_alert ON public.products(stock_quantity, min_stock_alert);