-- ===================================
-- FASE 5: CONFIGURAÇÕES POSTGRESQL
-- Monitoramento de Performance e Otimizações
-- ===================================

-- Função para obter estatísticas de conexões ativas
CREATE OR REPLACE FUNCTION public.get_connection_stats()
RETURNS TABLE(
    total_connections integer,
    active_connections integer,
    idle_connections integer,
    idle_in_transaction integer,
    max_connections integer,
    connection_usage_percent numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT count(*)::integer FROM pg_stat_activity) as total_connections,
        (SELECT count(*)::integer FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT count(*)::integer FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
        (SELECT count(*)::integer FROM pg_stat_activity WHERE state = 'idle in transaction') as idle_in_transaction,
        (SELECT setting::integer FROM pg_settings WHERE name = 'max_connections') as max_connections,
        ROUND(
            (SELECT count(*) FROM pg_stat_activity)::numeric / 
            (SELECT setting::numeric FROM pg_settings WHERE name = 'max_connections') * 100, 2
        ) as connection_usage_percent;
END;
$$;

-- Função para obter estatísticas de memória e cache
CREATE OR REPLACE FUNCTION public.get_memory_stats()
RETURNS TABLE(
    shared_buffers_size text,
    effective_cache_size text,
    work_mem text,
    maintenance_work_mem text,
    buffer_hit_ratio numeric,
    index_hit_ratio numeric,
    table_hit_ratio numeric,
    temp_files_count bigint,
    temp_bytes bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT setting || ' ' || unit FROM pg_settings WHERE name = 'shared_buffers') as shared_buffers_size,
        (SELECT setting || ' ' || unit FROM pg_settings WHERE name = 'effective_cache_size') as effective_cache_size,
        (SELECT setting || ' ' || unit FROM pg_settings WHERE name = 'work_mem') as work_mem,
        (SELECT setting || ' ' || unit FROM pg_settings WHERE name = 'maintenance_work_mem') as maintenance_work_mem,
        
        -- Buffer hit ratio (should be > 95%)
        ROUND(
            (SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100
             FROM pg_statio_user_tables
             WHERE heap_blks_hit + heap_blks_read > 0), 2
        ) as buffer_hit_ratio,
        
        -- Index hit ratio (should be > 95%)
        ROUND(
            (SELECT sum(idx_blks_hit) / (sum(idx_blks_hit) + sum(idx_blks_read)) * 100
             FROM pg_statio_user_indexes
             WHERE idx_blks_hit + idx_blks_read > 0), 2
        ) as index_hit_ratio,
        
        -- Table hit ratio (should be > 95%)
        ROUND(
            (SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100
             FROM pg_statio_user_tables
             WHERE heap_blks_hit + heap_blks_read > 0), 2
        ) as table_hit_ratio,
        
        -- Temporary files usage
        (SELECT sum(temp_files) FROM pg_stat_database) as temp_files_count,
        (SELECT sum(temp_bytes) FROM pg_stat_database) as temp_bytes;
END;
$$;

-- Função para obter queries mais lentas
CREATE OR REPLACE FUNCTION public.get_slow_queries()
RETURNS TABLE(
    query_text text,
    calls bigint,
    total_time numeric,
    mean_time numeric,
    max_time numeric,
    stddev_time numeric,
    rows_affected bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN length(ps.query) > 100 THEN left(ps.query, 100) || '...'
            ELSE ps.query
        END as query_text,
        ps.calls,
        ROUND(ps.total_exec_time::numeric, 2) as total_time,
        ROUND(ps.mean_exec_time::numeric, 2) as mean_time,
        ROUND(ps.max_exec_time::numeric, 2) as max_time,
        ROUND(ps.stddev_exec_time::numeric, 2) as stddev_time,
        ps.rows as rows_affected
    FROM pg_stat_statements ps
    WHERE ps.calls > 10  -- Apenas queries executadas mais de 10 vezes
    ORDER BY ps.mean_exec_time DESC
    LIMIT 20;
EXCEPTION
    WHEN undefined_table THEN
        -- pg_stat_statements extension não está disponível
        RETURN;
END;
$$;

-- Função para obter estatísticas de bloqueios
CREATE OR REPLACE FUNCTION public.get_lock_stats()
RETURNS TABLE(
    lock_type text,
    database_name text,
    relation_name text,
    mode_lock text,
    granted boolean,
    waiting_duration interval,
    query_text text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pl.locktype as lock_type,
        pd.datname as database_name,
        COALESCE(c.relname, pl.locktype) as relation_name,
        pl.mode as mode_lock,
        pl.granted,
        CASE 
            WHEN pl.granted THEN NULL
            ELSE now() - pa.query_start
        END as waiting_duration,
        CASE 
            WHEN length(pa.query) > 100 THEN left(pa.query, 100) || '...'
            ELSE pa.query
        END as query_text
    FROM pg_locks pl
    LEFT JOIN pg_database pd ON pl.database = pd.oid
    LEFT JOIN pg_class c ON pl.relation = c.oid
    LEFT JOIN pg_stat_activity pa ON pl.pid = pa.pid
    WHERE pl.pid IS NOT NULL
    AND pd.datname = current_database()
    ORDER BY 
        CASE WHEN pl.granted THEN 1 ELSE 0 END,
        pa.query_start;
END;
$$;

-- Função para obter recomendações de otimização
CREATE OR REPLACE FUNCTION public.get_optimization_recommendations()
RETURNS TABLE(
    category text,
    recommendation text,
    current_value text,
    recommended_value text,
    priority text,
    description text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    buffer_hit_ratio numeric;
    index_hit_ratio numeric;
    connection_usage numeric;
    temp_files_count bigint;
BEGIN
    -- Obter métricas atuais
    SELECT mem.buffer_hit_ratio, mem.index_hit_ratio 
    INTO buffer_hit_ratio, index_hit_ratio
    FROM public.get_memory_stats() mem;
    
    SELECT conn.connection_usage_percent, mem.temp_files_count
    INTO connection_usage, temp_files_count
    FROM public.get_connection_stats() conn,
         public.get_memory_stats() mem;

    -- Recomendação: Buffer Hit Ratio
    IF buffer_hit_ratio IS NOT NULL AND buffer_hit_ratio < 95 THEN
        RETURN QUERY SELECT 
            'Memory'::text,
            'Increase shared_buffers'::text,
            buffer_hit_ratio::text || '%',
            '95%+'::text,
            'High'::text,
            'Buffer hit ratio is below 95%. Consider increasing shared_buffers.'::text;
    END IF;

    -- Recomendação: Index Hit Ratio
    IF index_hit_ratio IS NOT NULL AND index_hit_ratio < 95 THEN
        RETURN QUERY SELECT 
            'Memory'::text,
            'Optimize index usage'::text,
            index_hit_ratio::text || '%',
            '95%+'::text,
            'High'::text,
            'Index hit ratio is below 95%. Review query patterns and index usage.'::text;
    END IF;

    -- Recomendação: Connection Usage
    IF connection_usage IS NOT NULL AND connection_usage > 80 THEN
        RETURN QUERY SELECT 
            'Connections'::text,
            'Optimize connection pooling'::text,
            connection_usage::text || '%',
            '<80%'::text,
            'Medium'::text,
            'Connection usage is high. Consider implementing connection pooling.'::text;
    END IF;

    -- Recomendação: Temporary Files
    IF temp_files_count IS NOT NULL AND temp_files_count > 1000 THEN
        RETURN QUERY SELECT 
            'Memory'::text,
            'Increase work_mem'::text,
            temp_files_count::text,
            '<1000'::text,
            'Medium'::text,
            'High number of temporary files suggests work_mem may be too low.'::text;
    END IF;

    -- Recomendações gerais sempre aplicáveis
    RETURN QUERY SELECT 
        'Performance'::text,
        'Regular VACUUM and ANALYZE'::text,
        'Manual'::text,
        'Automated'::text,
        'Low'::text,
        'Ensure regular maintenance tasks are scheduled and running.'::text;

    RETURN QUERY SELECT 
        'Monitoring'::text,
        'Enable query performance tracking'::text,
        'Basic'::text,
        'Advanced'::text,
        'Low'::text,
        'Monitor slow queries and optimize them regularly.'::text;
END;
$$;

-- Função para obter estatísticas de autovacuum
CREATE OR REPLACE FUNCTION public.get_vacuum_stats()
RETURNS TABLE(
    schema_name text,
    table_name text,
    last_vacuum timestamp with time zone,
    last_autovacuum timestamp with time zone,
    last_analyze timestamp with time zone,
    last_autoanalyze timestamp with time zone,
    vacuum_count bigint,
    autovacuum_count bigint,
    analyze_count bigint,
    autoanalyze_count bigint,
    n_dead_tup bigint,
    n_live_tup bigint,
    dead_tuple_percent numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.schemaname as schema_name,
        ps.relname as table_name,
        ps.last_vacuum,
        ps.last_autovacuum,
        ps.last_analyze,
        ps.last_autoanalyze,
        ps.vacuum_count,
        ps.autovacuum_count,
        ps.analyze_count,
        ps.autoanalyze_count,
        ps.n_dead_tup,
        ps.n_live_tup,
        CASE 
            WHEN ps.n_live_tup > 0 THEN
                ROUND((ps.n_dead_tup::numeric / ps.n_live_tup::numeric) * 100, 2)
            ELSE 0
        END as dead_tuple_percent
    FROM pg_stat_user_tables ps
    WHERE ps.schemaname = 'public'
    ORDER BY ps.n_dead_tup DESC;
END;
$$;