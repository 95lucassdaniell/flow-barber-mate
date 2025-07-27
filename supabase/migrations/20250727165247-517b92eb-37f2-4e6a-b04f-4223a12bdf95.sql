-- ===================================
-- FASE 3: ESTRATÉGIA DE ARQUIVAMENTO
-- ===================================

-- Criar schema separado para dados arquivados
CREATE SCHEMA IF NOT EXISTS archive;

-- Passo 1: Criar tabelas de arquivo com estrutura otimizada
CREATE TABLE archive.appointments (
    id uuid NOT NULL,
    barbershop_id uuid NOT NULL,
    client_id uuid NOT NULL,
    barber_id uuid NOT NULL,
    service_id uuid NOT NULL,
    appointment_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    status text NOT NULL,
    total_price numeric NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    archived_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE archive.sales (
    id uuid NOT NULL,
    barbershop_id uuid NOT NULL,
    client_id uuid NOT NULL,
    barber_id uuid NOT NULL,
    sale_date date NOT NULL,
    sale_time time without time zone NOT NULL,
    total_amount numeric NOT NULL,
    discount_amount numeric NOT NULL,
    final_amount numeric NOT NULL,
    payment_method text NOT NULL,
    payment_status text NOT NULL,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    cash_register_id uuid,
    archived_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE archive.commands (
    id uuid NOT NULL,
    command_number bigint NOT NULL,
    appointment_id uuid,
    client_id uuid NOT NULL,
    barber_id uuid NOT NULL,
    barbershop_id uuid NOT NULL,
    status text NOT NULL,
    total_amount numeric NOT NULL,
    payment_method text,
    payment_status text,
    notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    closed_at timestamp with time zone,
    archived_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Passo 2: Criar índices otimizados para consultas de arquivo
CREATE INDEX idx_archive_appointments_barbershop_date ON archive.appointments(barbershop_id, appointment_date);
CREATE INDEX idx_archive_appointments_archived_at ON archive.appointments(archived_at);

CREATE INDEX idx_archive_sales_barbershop_date ON archive.sales(barbershop_id, sale_date);
CREATE INDEX idx_archive_sales_archived_at ON archive.sales(archived_at);

CREATE INDEX idx_archive_commands_barbershop_date ON archive.commands(barbershop_id, created_at);
CREATE INDEX idx_archive_commands_archived_at ON archive.commands(archived_at);

-- Passo 3: Função para arquivamento automático baseado em idade dos dados
CREATE OR REPLACE FUNCTION public.archive_old_data(
    retention_months integer DEFAULT 12
)
RETURNS TABLE(
    table_name text,
    records_archived bigint,
    partitions_dropped integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, archive'
AS $$
DECLARE
    cutoff_date date;
    archived_count bigint;
    partition_name text;
    drop_count integer := 0;
BEGIN
    -- Calcular data de corte (dados mais antigos que X meses)
    cutoff_date := date_trunc('month', CURRENT_DATE - interval '1 month' * retention_months)::date;
    
    -- Arquivar appointments antigos
    INSERT INTO archive.appointments 
    SELECT *, now() as archived_at
    FROM public.appointments 
    WHERE appointment_date < cutoff_date;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'appointments'::text, archived_count, 0::integer;
    
    -- Deletar dados arquivados da tabela principal
    DELETE FROM public.appointments WHERE appointment_date < cutoff_date;
    
    -- Arquivar sales antigos
    INSERT INTO archive.sales 
    SELECT *, now() as archived_at
    FROM public.sales 
    WHERE sale_date < cutoff_date;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'sales'::text, archived_count, 0::integer;
    
    DELETE FROM public.sales WHERE sale_date < cutoff_date;
    
    -- Arquivar commands antigos
    INSERT INTO archive.commands 
    SELECT *, now() as archived_at
    FROM public.commands 
    WHERE created_at < cutoff_date;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN QUERY SELECT 'commands'::text, archived_count, 0::integer;
    
    DELETE FROM public.commands WHERE created_at < cutoff_date;
    
    -- Dropar partições antigas vazias
    FOR partition_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND (tablename LIKE 'appointments_%' 
             OR tablename LIKE 'sales_%' 
             OR tablename LIKE 'commands_%')
        AND tablename <= 'appointments_' || to_char(cutoff_date, 'YYYY_MM')
    LOOP
        BEGIN
            EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', partition_name);
            drop_count := drop_count + 1;
        EXCEPTION 
            WHEN OTHERS THEN 
                RAISE NOTICE 'Erro ao dropar partição %: %', partition_name, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT 'partitions_dropped'::text, 0::bigint, drop_count;
END;
$$;

-- Passo 4: Função para consulta de dados históricos (arquivo + ativo)
CREATE OR REPLACE FUNCTION public.get_historical_data(
    p_table_name text,
    p_barbershop_id uuid,
    p_start_date date,
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    id uuid,
    barbershop_id uuid,
    date_field date,
    amount numeric,
    status text,
    source_table text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, archive'
AS $$
BEGIN
    IF p_table_name = 'appointments' THEN
        RETURN QUERY
        SELECT 
            a.id, a.barbershop_id, a.appointment_date as date_field, 
            a.total_price as amount, a.status, 'active'::text as source_table
        FROM public.appointments a
        WHERE a.barbershop_id = p_barbershop_id 
        AND a.appointment_date BETWEEN p_start_date AND p_end_date
        
        UNION ALL
        
        SELECT 
            aa.id, aa.barbershop_id, aa.appointment_date as date_field,
            aa.total_price as amount, aa.status, 'archive'::text as source_table
        FROM archive.appointments aa
        WHERE aa.barbershop_id = p_barbershop_id 
        AND aa.appointment_date BETWEEN p_start_date AND p_end_date;
        
    ELSIF p_table_name = 'sales' THEN
        RETURN QUERY
        SELECT 
            s.id, s.barbershop_id, s.sale_date as date_field,
            s.final_amount as amount, s.payment_status as status, 'active'::text as source_table
        FROM public.sales s
        WHERE s.barbershop_id = p_barbershop_id 
        AND s.sale_date BETWEEN p_start_date AND p_end_date
        
        UNION ALL
        
        SELECT 
            sa.id, sa.barbershop_id, sa.sale_date as date_field,
            sa.final_amount as amount, sa.payment_status as status, 'archive'::text as source_table
        FROM archive.sales sa
        WHERE sa.barbershop_id = p_barbershop_id 
        AND sa.sale_date BETWEEN p_start_date AND p_end_date;
    END IF;
END;
$$;

-- Passo 5: Função para estatísticas de arquivo
CREATE OR REPLACE FUNCTION public.get_archive_stats()
RETURNS TABLE(
    table_name text,
    active_records bigint,
    archived_records bigint,
    total_active_size text,
    total_archive_size text,
    oldest_archive_date date
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, archive'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'appointments'::text,
        (SELECT COUNT(*) FROM public.appointments)::bigint,
        (SELECT COUNT(*) FROM archive.appointments)::bigint,
        pg_size_pretty(pg_total_relation_size('public.appointments')),
        pg_size_pretty(pg_total_relation_size('archive.appointments')),
        (SELECT MIN(appointment_date) FROM archive.appointments)
    
    UNION ALL
    
    SELECT 
        'sales'::text,
        (SELECT COUNT(*) FROM public.sales)::bigint,
        (SELECT COUNT(*) FROM archive.sales)::bigint,
        pg_size_pretty(pg_total_relation_size('public.sales')),
        pg_size_pretty(pg_total_relation_size('archive.sales')),
        (SELECT MIN(sale_date) FROM archive.sales)
    
    UNION ALL
    
    SELECT 
        'commands'::text,
        (SELECT COUNT(*) FROM public.commands)::bigint,
        (SELECT COUNT(*) FROM archive.commands)::bigint,
        pg_size_pretty(pg_total_relation_size('public.commands')),
        pg_size_pretty(pg_total_relation_size('archive.commands')),
        (SELECT MIN(created_at::date) FROM archive.commands);
END;
$$;

-- Passo 6: Função para limpeza segura de dados muito antigos (> 5 anos)
CREATE OR REPLACE FUNCTION public.cleanup_ancient_archives(
    years_to_keep integer DEFAULT 5
)
RETURNS bigint 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'archive'
AS $$
DECLARE
    cleanup_date date;
    total_deleted bigint := 0;
    deleted_count bigint;
BEGIN
    cleanup_date := CURRENT_DATE - interval '1 year' * years_to_keep;
    
    -- Deletar dados muito antigos do arquivo
    DELETE FROM archive.appointments WHERE appointment_date < cleanup_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    DELETE FROM archive.sales WHERE sale_date < cleanup_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    DELETE FROM archive.commands WHERE created_at::date < cleanup_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    
    -- Vacuum para liberar espaço
    VACUUM archive.appointments;
    VACUUM archive.sales;
    VACUUM archive.commands;
    
    RETURN total_deleted;
END;
$$;

-- Passo 7: Configurar permissões para acesso aos dados arquivados
ALTER TABLE archive.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive.commands ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para dados arquivados
CREATE POLICY "Users can view archived appointments from their barbershop" ON archive.appointments
FOR SELECT USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can view archived sales from their barbershop" ON archive.sales
FOR SELECT USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Users can view archived commands from their barbershop" ON archive.commands
FOR SELECT USING (barbershop_id = get_user_barbershop_id());