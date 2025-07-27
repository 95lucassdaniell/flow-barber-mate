-- Finalizar particionamento - apenas RLS e índices (constraints já existem)

-- Recriar índices otimizados para particionamento
CREATE INDEX IF NOT EXISTS idx_appointments_barbershop_date_status_part ON public.appointments(barbershop_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date_part ON public.appointments(barber_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_part ON public.appointments(client_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_sales_barbershop_date_payment_part ON public.sales(barbershop_id, sale_date, payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_barber_date_part ON public.sales(barber_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_client_part ON public.sales(client_id, sale_date);

CREATE INDEX IF NOT EXISTS idx_commands_barbershop_status_date_part ON public.commands(barbershop_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_commands_barber_status_part ON public.commands(barber_id, status);
CREATE INDEX IF NOT EXISTS idx_commands_appointment_part ON public.commands(appointment_id) WHERE appointment_id IS NOT NULL;

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

-- Criar função para estatísticas de partições
CREATE OR REPLACE FUNCTION public.get_partition_stats()
RETURNS TABLE(
    table_name text,
    partition_count bigint,
    total_size text,
    current_month_size text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'appointments'::text,
        COUNT(*)::bigint,
        pg_size_pretty(SUM(pg_total_relation_size('public'||'.'||tablename))),
        pg_size_pretty(COALESCE(MAX(CASE WHEN tablename LIKE '%'||to_char(CURRENT_DATE, 'YYYY_MM') THEN pg_total_relation_size('public'||'.'||tablename) END), 0))
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'appointments_%'
    
    UNION ALL
    
    SELECT 
        'sales'::text,
        COUNT(*)::bigint,
        pg_size_pretty(SUM(pg_total_relation_size('public'||'.'||tablename))),
        pg_size_pretty(COALESCE(MAX(CASE WHEN tablename LIKE '%'||to_char(CURRENT_DATE, 'YYYY_MM') THEN pg_total_relation_size('public'||'.'||tablename) END), 0))
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'sales_%'
    
    UNION ALL
    
    SELECT 
        'commands'::text,
        COUNT(*)::bigint,
        pg_size_pretty(SUM(pg_total_relation_size('public'||'.'||tablename))),
        pg_size_pretty(COALESCE(MAX(CASE WHEN tablename LIKE '%'||to_char(CURRENT_DATE, 'YYYY_MM') THEN pg_total_relation_size('public'||'.'||tablename) END), 0))
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'commands_%';
END;
$$;