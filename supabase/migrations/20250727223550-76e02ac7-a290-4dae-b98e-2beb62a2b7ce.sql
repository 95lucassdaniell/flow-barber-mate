-- Criar tabelas para módulo financeiro completo

-- Tabela de despesas
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id uuid NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  payment_date date,
  payment_status text NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para histórico de fechamento de caixa
CREATE TABLE public.cash_register_closures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id uuid NOT NULL,
  closed_by uuid NOT NULL,
  opening_balance numeric NOT NULL DEFAULT 0,
  closing_balance numeric NOT NULL DEFAULT 0,
  total_sales numeric NOT NULL DEFAULT 0,
  total_cash numeric NOT NULL DEFAULT 0,
  total_card numeric NOT NULL DEFAULT 0,
  total_pix numeric NOT NULL DEFAULT 0,
  total_multiple numeric NOT NULL DEFAULT 0,
  discrepancy numeric NOT NULL DEFAULT 0,
  notes text,
  closed_at timestamp with time zone NOT NULL DEFAULT now(),
  barbershop_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_register_closures ENABLE ROW LEVEL SECURITY;

-- RLS policies para expenses
CREATE POLICY "Admins can manage expenses in their barbershop" 
ON public.expenses 
FOR ALL 
USING (
  barbershop_id = get_user_barbershop_id() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'receptionist') 
    AND barbershop_id = get_user_barbershop_id()
  )
);

CREATE POLICY "Users can view expenses from their barbershop" 
ON public.expenses 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

-- RLS policies para cash_register_closures
CREATE POLICY "Users can manage cash closures in their barbershop" 
ON public.cash_register_closures 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can view cash closures from their barbershop" 
ON public.cash_register_closures 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

-- Triggers para updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_expenses_barbershop_id ON public.expenses(barbershop_id);
CREATE INDEX idx_expenses_due_date ON public.expenses(due_date);
CREATE INDEX idx_expenses_payment_status ON public.expenses(payment_status);
CREATE INDEX idx_cash_closures_barbershop_id ON public.cash_register_closures(barbershop_id);
CREATE INDEX idx_cash_closures_closed_at ON public.cash_register_closures(closed_at);