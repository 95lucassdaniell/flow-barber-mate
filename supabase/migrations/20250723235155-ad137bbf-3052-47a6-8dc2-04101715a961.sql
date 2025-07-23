-- Criar tabela de registros de caixa
CREATE TABLE public.cash_registers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  closing_balance DECIMAL(10,2),
  total_sales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_card DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_pix DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_multiple DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sales_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens temporários do carrinho
CREATE TABLE public.cash_register_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('service', 'product')),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (
    (item_type = 'service' AND service_id IS NOT NULL AND product_id IS NULL) OR
    (item_type = 'product' AND product_id IS NOT NULL AND service_id IS NULL)
  )
);

-- Adicionar campo cash_register_id na tabela sales
ALTER TABLE public.sales 
ADD COLUMN cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cash_registers
CREATE POLICY "Users can view their own cash registers" 
ON public.cash_registers 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  barbershop_id IN (
    SELECT barbershop_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')
  )
);

CREATE POLICY "Users can manage their own cash registers" 
ON public.cash_registers 
FOR ALL 
USING (
  user_id = auth.uid() AND
  barbershop_id IN (
    SELECT barbershop_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'receptionist')
  )
);

-- Políticas RLS para cash_register_items
CREATE POLICY "Users can view their own cash register items" 
ON public.cash_register_items 
FOR SELECT 
USING (
  cash_register_id IN (
    SELECT id FROM public.cash_registers 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own cash register items" 
ON public.cash_register_items 
FOR ALL 
USING (
  cash_register_id IN (
    SELECT id FROM public.cash_registers 
    WHERE user_id = auth.uid()
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_cash_registers_updated_at
BEFORE UPDATE ON public.cash_registers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_register_items_updated_at
BEFORE UPDATE ON public.cash_register_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_cash_registers_user_id ON public.cash_registers(user_id);
CREATE INDEX idx_cash_registers_barbershop_id ON public.cash_registers(barbershop_id);
CREATE INDEX idx_cash_registers_status ON public.cash_registers(status);
CREATE INDEX idx_cash_register_items_cash_register_id ON public.cash_register_items(cash_register_id);
CREATE INDEX idx_cash_register_items_item_type ON public.cash_register_items(item_type);
CREATE INDEX idx_sales_cash_register_id ON public.sales(cash_register_id);

-- Constraint para garantir apenas um caixa aberto por usuário
CREATE UNIQUE INDEX idx_unique_open_cash_register 
ON public.cash_registers(user_id, barbershop_id) 
WHERE status = 'open';