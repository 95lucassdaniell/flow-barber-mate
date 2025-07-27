-- Corrigir dados com valores null antes da migração

-- Primeiro, corrigir dados null nas tabelas originais
UPDATE public.commands SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.sales SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.appointments SET updated_at = created_at WHERE updated_at IS NULL;

-- Agora migrar os dados corrigidos
INSERT INTO public.appointments_partitioned SELECT * FROM public.appointments;
INSERT INTO public.sales_partitioned SELECT * FROM public.sales;
INSERT INTO public.commands_partitioned SELECT * FROM public.commands;

-- Fazer backup das tabelas originais e substituir
ALTER TABLE public.appointments RENAME TO appointments_backup;
ALTER TABLE public.sales RENAME TO sales_backup;
ALTER TABLE public.commands RENAME TO commands_backup;

ALTER TABLE public.appointments_partitioned RENAME TO appointments;
ALTER TABLE public.sales_partitioned RENAME TO sales;
ALTER TABLE public.commands_partitioned RENAME TO commands;

-- Recriar constraints de chave primária compostas
ALTER TABLE public.appointments ADD CONSTRAINT appointments_pkey PRIMARY KEY (id, appointment_date);
ALTER TABLE public.sales ADD CONSTRAINT sales_pkey PRIMARY KEY (id, sale_date);
ALTER TABLE public.commands ADD CONSTRAINT commands_pkey PRIMARY KEY (id, created_at);

-- Recriar índices otimizados para particionamento
CREATE INDEX idx_appointments_barbershop_date_status_part ON public.appointments(barbershop_id, appointment_date, status);
CREATE INDEX idx_appointments_barber_date_part ON public.appointments(barber_id, appointment_date);
CREATE INDEX idx_appointments_client_part ON public.appointments(client_id, appointment_date);

CREATE INDEX idx_sales_barbershop_date_payment_part ON public.sales(barbershop_id, sale_date, payment_method);
CREATE INDEX idx_sales_barber_date_part ON public.sales(barber_id, sale_date);
CREATE INDEX idx_sales_client_part ON public.sales(client_id, sale_date);

CREATE INDEX idx_commands_barbershop_status_date_part ON public.commands(barbershop_id, status, created_at);
CREATE INDEX idx_commands_barber_status_part ON public.commands(barber_id, status);
CREATE INDEX idx_commands_appointment_part ON public.commands(appointment_id) WHERE appointment_id IS NOT NULL;

-- Recriar trigger para command_number
CREATE TRIGGER set_command_number_trigger
BEFORE INSERT ON public.commands
FOR EACH ROW
EXECUTE FUNCTION public.set_command_number();

-- Configurar RLS nas novas tabelas particionadas
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;

-- Recriar políticas RLS para appointments
CREATE POLICY "Users can view appointments from their barbershop" ON public.appointments
FOR SELECT USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can manage appointments in their barbershop" ON public.appointments
FOR ALL USING (barbershop_id IN (
    SELECT barbershop_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin', 'receptionist'])
));

CREATE POLICY "Barbers can view their own appointments" ON public.appointments
FOR SELECT USING (barber_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Barbers can update their own appointments" ON public.appointments
FOR UPDATE USING (barber_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

-- Recriar políticas RLS para sales
CREATE POLICY "Users can view sales from their barbershop" ON public.sales
FOR SELECT USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop" ON public.sales
FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin', 'receptionist']) 
    AND barbershop_id = get_user_barbershop_id()
));

CREATE POLICY "Barbers can view their own sales" ON public.sales
FOR SELECT USING (barbershop_id = get_user_barbershop_id() AND barber_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND barbershop_id = get_user_barbershop_id()
));

-- Recriar políticas RLS para commands
CREATE POLICY "Users can view commands from their barbershop" ON public.commands
FOR SELECT USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage commands in their barbershop" ON public.commands
FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin', 'receptionist']) 
    AND barbershop_id = get_user_barbershop_id()
));

CREATE POLICY "Barbers can view their own commands" ON public.commands
FOR SELECT USING (barbershop_id = get_user_barbershop_id() AND barber_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid() AND barbershop_id = get_user_barbershop_id()
));