-- Corrigir warnings de segurança - adicionar search_path nas funções criadas

-- Corrigir função create_monthly_partition
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_name text,
    start_date date
) RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, table_name, start_date, end_date
    );
    
    -- Criar índices específicos na partição
    IF table_name = 'appointments' THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(barbershop_id, appointment_date)', 
                      partition_name || '_barbershop_date_idx', partition_name);
    ELSIF table_name = 'sales' THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(barbershop_id, sale_date)', 
                      partition_name || '_barbershop_date_idx', partition_name);
    ELSIF table_name = 'commands' THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(barbershop_id, created_at)', 
                      partition_name || '_barbershop_date_idx', partition_name);
    END IF;
END;
$$;

-- Corrigir função get_table_stats
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    table_size text,
    index_size text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    AND tablename IN ('appointments', 'sales', 'commands', 'clients', 'commissions')
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$;

-- Corrigir função get_barbershop_performance_stats
CREATE OR REPLACE FUNCTION get_barbershop_performance_stats(barbershop_uuid uuid)
RETURNS TABLE(
    metric_name text,
    metric_value numeric,
    metric_date date
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'appointments_today'::text,
        COUNT(*)::numeric,
        CURRENT_DATE
    FROM public.appointments 
    WHERE barbershop_id = barbershop_uuid 
    AND appointment_date = CURRENT_DATE
    
    UNION ALL
    
    SELECT 
        'sales_today'::text,
        COALESCE(SUM(final_amount), 0),
        CURRENT_DATE
    FROM public.sales 
    WHERE barbershop_id = barbershop_uuid 
    AND sale_date = CURRENT_DATE
    
    UNION ALL
    
    SELECT 
        'commands_open'::text,
        COUNT(*)::numeric,
        CURRENT_DATE
    FROM public.commands 
    WHERE barbershop_id = barbershop_uuid 
    AND status = 'open';
END;
$$;