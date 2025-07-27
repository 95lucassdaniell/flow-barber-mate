-- Criar tabela de comandas
CREATE TABLE public.commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  command_number BIGINT NOT NULL,
  appointment_id UUID,
  client_id UUID NOT NULL,
  barber_id UUID NOT NULL,
  barbershop_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  total_amount NUMERIC NOT NULL DEFAULT 0.00,
  payment_method TEXT DEFAULT NULL,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar sequência para números únicos de comanda
CREATE SEQUENCE public.command_number_seq START 100000000;

-- Função para gerar número único de comanda
CREATE OR REPLACE FUNCTION public.generate_command_number()
RETURNS BIGINT AS $$
BEGIN
  RETURN nextval('command_number_seq');
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-gerar número da comanda
CREATE OR REPLACE FUNCTION public.set_command_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.command_number IS NULL THEN
    NEW.command_number = generate_command_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_command_number
  BEFORE INSERT ON public.commands
  FOR EACH ROW
  EXECUTE FUNCTION public.set_command_number();

-- Trigger para updated_at
CREATE TRIGGER update_commands_updated_at
  BEFORE UPDATE ON public.commands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view commands from their barbershop"
  ON public.commands FOR SELECT
  USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage commands in their barbershop"
  ON public.commands FOR ALL
  USING (
    barbershop_id = get_user_barbershop_id() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'receptionist')
      AND barbershop_id = get_user_barbershop_id()
    )
  );

CREATE POLICY "Barbers can view their own commands"
  ON public.commands FOR SELECT
  USING (
    barbershop_id = get_user_barbershop_id() AND
    barber_id IN (
      SELECT id FROM public.profiles
      WHERE user_id = auth.uid()
      AND barbershop_id = get_user_barbershop_id()
    )
  );

-- Criar tabela de itens da comanda
CREATE TABLE public.command_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  command_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('service', 'product')),
  service_id UUID,
  product_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0.00,
  total_price NUMERIC NOT NULL DEFAULT 0.00,
  commission_rate NUMERIC NOT NULL DEFAULT 0.00,
  commission_amount NUMERIC NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para updated_at em command_items
CREATE TRIGGER update_command_items_updated_at
  BEFORE UPDATE ON public.command_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.command_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para command_items
CREATE POLICY "Users can view command items from their barbershop"
  ON public.command_items FOR SELECT
  USING (
    command_id IN (
      SELECT id FROM public.commands
      WHERE barbershop_id = get_user_barbershop_id()
    )
  );

CREATE POLICY "Admins can manage command items in their barbershop"
  ON public.command_items FOR ALL
  USING (
    command_id IN (
      SELECT id FROM public.commands
      WHERE barbershop_id = get_user_barbershop_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'receptionist')
        AND barbershop_id = get_user_barbershop_id()
      )
    )
  );

-- Função para criar comanda automaticamente quando agendamento é criado
CREATE OR REPLACE FUNCTION public.create_command_for_appointment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.commands (
    appointment_id,
    client_id,
    barber_id,
    barbershop_id,
    status
  ) VALUES (
    NEW.id,
    NEW.client_id,
    NEW.barber_id,
    NEW.barbershop_id,
    'open'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar comanda quando agendamento é criado
CREATE TRIGGER trigger_create_command_for_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_command_for_appointment();