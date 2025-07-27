-- Criar tabela para movimentações de caixa
CREATE TABLE public.cash_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cash_movements
CREATE POLICY "Users can manage their own cash movements"
  ON public.cash_movements
  FOR ALL
  USING (cash_register_id IN (
    SELECT cash_registers.id
    FROM cash_registers
    WHERE (cash_registers.user_id = auth.uid())
  ));

CREATE POLICY "Users can view cash movements from their barbershop"
  ON public.cash_movements
  FOR SELECT
  USING (cash_register_id IN (
    SELECT cash_registers.id
    FROM cash_registers
    WHERE (cash_registers.barbershop_id IN (
      SELECT profiles.barbershop_id
      FROM profiles
      WHERE (profiles.user_id = auth.uid())
    ))
  ));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cash_movements_updated_at
  BEFORE UPDATE ON public.cash_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices para performance
CREATE INDEX idx_cash_movements_cash_register_id ON public.cash_movements(cash_register_id);
CREATE INDEX idx_cash_movements_created_at ON public.cash_movements(created_at);
CREATE INDEX idx_cash_movements_type ON public.cash_movements(type);