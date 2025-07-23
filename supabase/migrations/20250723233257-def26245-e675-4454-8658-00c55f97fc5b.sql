-- Criar tabela de vendas
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL,
  client_id UUID NOT NULL,
  barber_id UUID NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_time TIME NOT NULL DEFAULT CURRENT_TIME,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'paid',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens da venda
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('service', 'product')),
  service_id UUID,
  product_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT sale_items_service_or_product CHECK (
    (item_type = 'service' AND service_id IS NOT NULL AND product_id IS NULL) OR
    (item_type = 'product' AND product_id IS NOT NULL AND service_id IS NULL)
  )
);

-- Criar tabela de comissões
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL,
  barber_id UUID NOT NULL,
  sale_id UUID NOT NULL,
  sale_item_id UUID NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('service', 'product')),
  base_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sales
CREATE POLICY "Users can view sales from their barbershop"
ON public.sales
FOR SELECT
TO authenticated
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop"
ON public.sales
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

CREATE POLICY "Barbers can view their own sales"
ON public.sales
FOR SELECT
TO authenticated
USING (
  barbershop_id = get_user_barbershop_id()
  AND barber_id IN (
    SELECT id FROM public.profiles
    WHERE user_id = auth.uid()
    AND barbershop_id = get_user_barbershop_id()
  )
);

-- Políticas RLS para sale_items
CREATE POLICY "Users can view sale items from their barbershop"
ON public.sale_items
FOR SELECT
TO authenticated
USING (
  sale_id IN (
    SELECT id FROM public.sales
    WHERE barbershop_id = get_user_barbershop_id()
  )
);

CREATE POLICY "Admins can manage sale items in their barbershop"
ON public.sale_items
FOR ALL
TO authenticated
USING (
  sale_id IN (
    SELECT id FROM public.sales
    WHERE barbershop_id = get_user_barbershop_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'receptionist')
      AND barbershop_id = get_user_barbershop_id()
    )
  )
);

-- Políticas RLS para commissions
CREATE POLICY "Users can view commissions from their barbershop"
ON public.commissions
FOR SELECT
TO authenticated
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage commissions in their barbershop"
ON public.commissions
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

CREATE POLICY "Barbers can view their own commissions"
ON public.commissions
FOR SELECT
TO authenticated
USING (
  barbershop_id = get_user_barbershop_id()
  AND barber_id IN (
    SELECT id FROM public.profiles
    WHERE user_id = auth.uid()
    AND barbershop_id = get_user_barbershop_id()
  )
);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sale_items_updated_at
BEFORE UPDATE ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at
BEFORE UPDATE ON public.commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_sales_barbershop_id ON public.sales(barbershop_id);
CREATE INDEX idx_sales_barber_id ON public.sales(barber_id);
CREATE INDEX idx_sales_client_id ON public.sales(client_id);
CREATE INDEX idx_sales_date ON public.sales(sale_date);
CREATE INDEX idx_sales_status ON public.sales(payment_status);

CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_service_id ON public.sale_items(service_id);
CREATE INDEX idx_sale_items_product_id ON public.sale_items(product_id);

CREATE INDEX idx_commissions_barbershop_id ON public.commissions(barbershop_id);
CREATE INDEX idx_commissions_barber_id ON public.commissions(barber_id);
CREATE INDEX idx_commissions_sale_id ON public.commissions(sale_id);
CREATE INDEX idx_commissions_date ON public.commissions(commission_date);
CREATE INDEX idx_commissions_status ON public.commissions(status);