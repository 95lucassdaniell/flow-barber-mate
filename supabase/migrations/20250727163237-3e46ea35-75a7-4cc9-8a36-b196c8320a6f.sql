-- ===================================
-- FASE 1: OTIMIZAÇÕES DE ÍNDICES CRÍTICOS
-- ===================================

-- Índices compostos para dashboard queries (alta prioridade)
CREATE INDEX IF NOT EXISTS idx_appointments_barbershop_date_status ON appointments(barbershop_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_barbershop_date_barber ON appointments(barbershop_id, appointment_date, barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments(barber_id, appointment_date);

-- Índices para relatórios financeiros e vendas
CREATE INDEX IF NOT EXISTS idx_sales_barbershop_date_payment ON sales(barbershop_id, sale_date, payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_barber_date ON sales(barber_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_date_amount ON sales(sale_date, final_amount);

-- Índices para comandas (critical path)
CREATE INDEX IF NOT EXISTS idx_commands_barbershop_status_date ON commands(barbershop_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_commands_barber_status ON commands(barber_id, status);
CREATE INDEX IF NOT EXISTS idx_commands_appointment ON commands(appointment_id) WHERE appointment_id IS NOT NULL;

-- Índices para comissões (relatórios de performance)
CREATE INDEX IF NOT EXISTS idx_commissions_barbershop_date ON commissions(barbershop_id, commission_date);
CREATE INDEX IF NOT EXISTS idx_commissions_barber_date_status ON commissions(barber_id, commission_date, status);

-- Índices para cash registers (PDV performance)
CREATE INDEX IF NOT EXISTS idx_cash_registers_barbershop_status_date ON cash_registers(barbershop_id, status, opened_at);
CREATE INDEX IF NOT EXISTS idx_cash_registers_user_date ON cash_registers(user_id, opened_at);

-- Índices para clientes (busca rápida)
CREATE INDEX IF NOT EXISTS idx_clients_barbershop_name ON clients(barbershop_id, name);
CREATE INDEX IF NOT EXISTS idx_clients_barbershop_phone ON clients(barbershop_id, phone);

-- Índices para produtos (estoque e vendas)
CREATE INDEX IF NOT EXISTS idx_products_barbershop_active ON products(barbershop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(barbershop_id, category, is_active);

-- ===================================
-- FASE 2: PARTICIONAMENTO POR DATA
-- ===================================

-- Função para criar partições automaticamente
CREATE OR REPLACE FUNCTION create_monthly_partition(
    table_name text,
    start_date date
) RETURNS void AS $$
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
$$ LANGUAGE plpgsql;

-- ===================================
-- FASE 3: FUNÇÕES DE MONITORAMENTO
-- ===================================

-- Função para monitorar performance de queries críticas
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    table_size text,
    index_size text
) AS $$
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
$$ LANGUAGE plpgsql;

-- Função para detectar queries lentas por barbershop
CREATE OR REPLACE FUNCTION get_barbershop_performance_stats(barbershop_uuid uuid)
RETURNS TABLE(
    metric_name text,
    metric_value numeric,
    metric_date date
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'appointments_today'::text,
        COUNT(*)::numeric,
        CURRENT_DATE
    FROM appointments 
    WHERE barbershop_id = barbershop_uuid 
    AND appointment_date = CURRENT_DATE
    
    UNION ALL
    
    SELECT 
        'sales_today'::text,
        COALESCE(SUM(final_amount), 0),
        CURRENT_DATE
    FROM sales 
    WHERE barbershop_id = barbershop_uuid 
    AND sale_date = CURRENT_DATE
    
    UNION ALL
    
    SELECT 
        'commands_open'::text,
        COUNT(*)::numeric,
        CURRENT_DATE
    FROM commands 
    WHERE barbershop_id = barbershop_uuid 
    AND status = 'open';
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- FASE 4: OTIMIZAÇÕES DE RLS
-- ===================================

-- Otimizar função get_user_barbershop_id para cache
CREATE OR REPLACE FUNCTION public.get_user_barbershop_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT barbershop_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Adicionar índice para otimizar RLS policies
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_barbershop ON profiles(user_id, barbershop_id);

-- ===================================
-- CONFIGURAÇÕES DE PERFORMANCE
-- ===================================

-- Configurar autovacuum mais agressivo para tabelas críticas
ALTER TABLE appointments SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE sales SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE commands SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
);