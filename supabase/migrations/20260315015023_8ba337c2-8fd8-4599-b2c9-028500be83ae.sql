
-- Add missing columns to commissions table
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS sale_item_id UUID;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS commission_type TEXT;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS base_amount NUMERIC DEFAULT 0;
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add missing columns to subscription_usage_history
ALTER TABLE public.subscription_usage_history ADD COLUMN IF NOT EXISTS command_id UUID REFERENCES public.commands(id) ON DELETE SET NULL;
ALTER TABLE public.subscription_usage_history ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE public.subscription_usage_history ADD COLUMN IF NOT EXISTS discounted_price NUMERIC DEFAULT 0;

-- Add missing column to subscription_financial_records
ALTER TABLE public.subscription_financial_records ADD COLUMN IF NOT EXISTS due_date DATE;

-- Create get_table_stats RPC
CREATE OR REPLACE FUNCTION public.get_table_stats()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT as table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename AND table_schema = 'public')::BIGINT as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))) as table_size,
    pg_size_pretty(pg_indexes_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))) as index_size
  FROM pg_tables t
  WHERE t.schemaname = 'public';
END;
$$;

-- Create get_vacuum_stats RPC
CREATE OR REPLACE FUNCTION public.get_vacuum_stats()
RETURNS TABLE (
  schema_name TEXT,
  table_name TEXT,
  last_vacuum TIMESTAMP WITH TIME ZONE,
  last_autovacuum TIMESTAMP WITH TIME ZONE,
  last_analyze TIMESTAMP WITH TIME ZONE,
  last_autoanalyze TIMESTAMP WITH TIME ZONE,
  vacuum_count BIGINT,
  autovacuum_count BIGINT,
  analyze_count BIGINT,
  autoanalyze_count BIGINT,
  dead_tuples BIGINT,
  live_tuples BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname::TEXT,
    relname::TEXT,
    s.last_vacuum,
    s.last_autovacuum,
    s.last_analyze,
    s.last_autoanalyze,
    s.vacuum_count,
    s.autovacuum_count,
    s.analyze_count,
    s.autoanalyze_count,
    s.n_dead_tup,
    s.n_live_tup
  FROM pg_stat_user_tables s
  WHERE schemaname = 'public';
END;
$$;
