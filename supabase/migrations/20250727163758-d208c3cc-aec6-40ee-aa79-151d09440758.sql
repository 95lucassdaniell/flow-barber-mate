-- Corrigir função create_monthly_partition para especificar schema público
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_name text,
    start_date date
) RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.%I 
         FOR VALUES FROM (%L) TO (%L)',
        partition_name, table_name, start_date, end_date
    );
    
    -- Criar índices específicos na partição
    IF table_name = 'appointments' THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(barbershop_id, appointment_date)', 
                      partition_name || '_barbershop_date_idx', partition_name);
    ELSIF table_name = 'sales' THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(barbershop_id, sale_date)', 
                      partition_name || '_barbershop_date_idx', partition_name);
    ELSIF table_name = 'commands' THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(barbershop_id, created_at)', 
                      partition_name || '_barbershop_date_idx', partition_name);
    END IF;
END;
$$;