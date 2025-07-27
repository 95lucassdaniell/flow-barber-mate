-- ===================================
-- FASE 2: PARTICIONAMENTO DE TABELAS
-- ===================================

-- Passo 1: Criar tabela appointments particionada
CREATE TABLE appointments_partitioned (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    barber_id uuid NOT NULL,
    service_id uuid NOT NULL,
    barbershop_id uuid NOT NULL,
    appointment_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    status text NOT NULL DEFAULT 'scheduled'::text,
    total_price numeric NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
) PARTITION BY RANGE (appointment_date);

-- Passo 2: Criar tabela sales particionada
CREATE TABLE sales_partitioned (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    barbershop_id uuid NOT NULL,
    client_id uuid NOT NULL,
    barber_id uuid NOT NULL,
    sale_date date NOT NULL DEFAULT CURRENT_DATE,
    sale_time time without time zone NOT NULL DEFAULT CURRENT_TIME,
    total_amount numeric NOT NULL DEFAULT 0.00,
    discount_amount numeric NOT NULL DEFAULT 0.00,
    final_amount numeric NOT NULL DEFAULT 0.00,
    payment_method text NOT NULL DEFAULT 'cash'::text,
    payment_status text NOT NULL DEFAULT 'paid'::text,
    cash_register_id uuid,
    created_by uuid NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
) PARTITION BY RANGE (sale_date);

-- Passo 3: Criar tabela commands particionada
CREATE TABLE commands_partitioned (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    command_number bigint NOT NULL,
    appointment_id uuid,
    client_id uuid NOT NULL,
    barber_id uuid NOT NULL,
    barbershop_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'open'::text,
    total_amount numeric NOT NULL DEFAULT 0.00,
    payment_method text,
    payment_status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    closed_at timestamp with time zone
) PARTITION BY RANGE (created_at);

-- Passo 4: Criar partições para os últimos 6 meses e próximos 12 meses
-- Appointments partitions
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE - interval '6 months')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE - interval '5 months')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE - interval '4 months')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE - interval '3 months')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE - interval '2 months')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE - interval '1 month')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE)::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE + interval '1 month')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE + interval '2 months')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE + interval '3 months')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE + interval '4 months')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE + interval '5 months')::date);
SELECT create_monthly_partition('appointments_partitioned', date_trunc('month', CURRENT_DATE + interval '6 months')::date);

-- Sales partitions
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE - interval '6 months')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE - interval '5 months')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE - interval '4 months')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE - interval '3 months')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE - interval '2 months')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE - interval '1 month')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE)::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE + interval '1 month')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE + interval '2 months')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE + interval '3 months')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE + interval '4 months')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE + interval '5 months')::date);
SELECT create_monthly_partition('sales_partitioned', date_trunc('month', CURRENT_DATE + interval '6 months')::date);

-- Commands partitions (por created_at convertido para date)
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE - interval '6 months')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE - interval '5 months')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE - interval '4 months')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE - interval '3 months')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE - interval '2 months')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE - interval '1 month')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE)::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE + interval '1 month')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE + interval '2 months')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE + interval '3 months')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE + interval '4 months')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE + interval '5 months')::date);
SELECT create_monthly_partition('commands_partitioned', date_trunc('month', CURRENT_DATE + interval '6 months')::date);

-- Passo 5: Migrar dados existentes
INSERT INTO appointments_partitioned SELECT * FROM appointments;
INSERT INTO sales_partitioned SELECT * FROM sales;
INSERT INTO commands_partitioned SELECT * FROM commands;

-- Passo 6: Renomear tabelas (backup das originais e substituição)
ALTER TABLE appointments RENAME TO appointments_backup;
ALTER TABLE sales RENAME TO sales_backup;
ALTER TABLE commands RENAME TO commands_backup;

ALTER TABLE appointments_partitioned RENAME TO appointments;
ALTER TABLE sales_partitioned RENAME TO sales;
ALTER TABLE commands_partitioned RENAME TO commands;

-- Passo 7: Recriar constraints e chaves primárias
ALTER TABLE appointments ADD CONSTRAINT appointments_pkey PRIMARY KEY (id, appointment_date);
ALTER TABLE sales ADD CONSTRAINT sales_pkey PRIMARY KEY (id, sale_date);
ALTER TABLE commands ADD CONSTRAINT commands_pkey PRIMARY KEY (id, created_at);

-- Passo 8: Recriar índices principais adaptados para particionamento
CREATE INDEX idx_appointments_barbershop_date_status_part ON appointments(barbershop_id, appointment_date, status);
CREATE INDEX idx_appointments_barber_date_part ON appointments(barber_id, appointment_date);
CREATE INDEX idx_appointments_client_part ON appointments(client_id, appointment_date);

CREATE INDEX idx_sales_barbershop_date_payment_part ON sales(barbershop_id, sale_date, payment_method);
CREATE INDEX idx_sales_barber_date_part ON sales(barber_id, sale_date);
CREATE INDEX idx_sales_client_part ON sales(client_id, sale_date);

CREATE INDEX idx_commands_barbershop_status_date_part ON commands(barbershop_id, status, created_at);
CREATE INDEX idx_commands_barber_status_part ON commands(barber_id, status);
CREATE INDEX idx_commands_appointment_part ON commands(appointment_id) WHERE appointment_id IS NOT NULL;

-- Passo 9: Recriar triggers para command_number
CREATE TRIGGER set_command_number_trigger
BEFORE INSERT ON commands
FOR EACH ROW
EXECUTE FUNCTION set_command_number();

-- Passo 10: Função para criação automática de partições futuras
CREATE OR REPLACE FUNCTION auto_create_monthly_partitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    next_month date;
BEGIN
    next_month := date_trunc('month', CURRENT_DATE + interval '7 months')::date;
    
    -- Criar partições para o próximo mês nas 3 tabelas
    PERFORM create_monthly_partition('appointments', next_month);
    PERFORM create_monthly_partition('sales', next_month);
    PERFORM create_monthly_partition('commands', next_month);
    
    RAISE NOTICE 'Partições criadas para: %', next_month;
END;
$$;

-- Passo 11: Configurar RLS nas novas tabelas particionadas
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;

-- Recriar políticas RLS para appointments
CREATE POLICY "Users can view appointments from their barbershop" ON appointments
FOR SELECT USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can manage appointments in their barbershop" ON appointments
FOR ALL USING (barbershop_id IN (
    SELECT barbershop_id FROM profiles 
    WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin', 'receptionist'])
));

CREATE POLICY "Barbers can view their own appointments" ON appointments
FOR SELECT USING (barber_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Barbers can update their own appointments" ON appointments
FOR UPDATE USING (barber_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- Recriar políticas RLS para sales
CREATE POLICY "Users can view sales from their barbershop" ON sales
FOR SELECT USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage sales in their barbershop" ON sales
FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin', 'receptionist']) 
    AND barbershop_id = get_user_barbershop_id()
));

CREATE POLICY "Barbers can view their own sales" ON sales
FOR SELECT USING (barbershop_id = get_user_barbershop_id() AND barber_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND barbershop_id = get_user_barbershop_id()
));

-- Recriar políticas RLS para commands
CREATE POLICY "Users can view commands from their barbershop" ON commands
FOR SELECT USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage commands in their barbershop" ON commands
FOR ALL USING (barbershop_id = get_user_barbershop_id() AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin', 'receptionist']) 
    AND barbershop_id = get_user_barbershop_id()
));

CREATE POLICY "Barbers can view their own commands" ON commands
FOR SELECT USING (barbershop_id = get_user_barbershop_id() AND barber_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND barbershop_id = get_user_barbershop_id()
));

-- Passo 12: Atualizar função de estatísticas para trabalhar com partições
CREATE OR REPLACE FUNCTION get_table_stats_partitioned()
RETURNS TABLE(
    table_name text,
    partition_count bigint,
    total_size text,
    recent_partition_size text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'appointments'::text,
        COUNT(*)::bigint,
        pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))),
        pg_size_pretty(MAX(pg_total_relation_size(schemaname||'.'||tablename)))
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'appointments_%'
    
    UNION ALL
    
    SELECT 
        'sales'::text,
        COUNT(*)::bigint,
        pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))),
        pg_size_pretty(MAX(pg_total_relation_size(schemaname||'.'||tablename)))
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'sales_%'
    
    UNION ALL
    
    SELECT 
        'commands'::text,
        COUNT(*)::bigint,
        pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))),
        pg_size_pretty(MAX(pg_total_relation_size(schemaname||'.'||tablename)))
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE 'commands_%';
END;
$$;