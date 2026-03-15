
-- Add missing table cash_register_items
CREATE TABLE public.cash_register_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_register_id UUID REFERENCES public.cash_registers(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'service',
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_register_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD cash_register_items" ON public.cash_register_items FOR ALL TO authenticated
  USING (cash_register_id IN (SELECT cr.id FROM public.cash_registers cr WHERE cr.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())))
  WITH CHECK (cash_register_id IN (SELECT cr.id FROM public.cash_registers cr WHERE cr.barbershop_id IN (SELECT p.barbershop_id FROM public.profiles p WHERE p.user_id = auth.uid())));

-- Add missing column next_billing_date to barbershops
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS next_billing_date DATE;

-- Create get_archive_stats RPC (returns empty for now)
CREATE OR REPLACE FUNCTION public.get_archive_stats()
RETURNS TABLE (
  table_name TEXT,
  active_records BIGINT,
  archived_records BIGINT,
  total_active_size TEXT,
  total_archive_size TEXT,
  oldest_archive_date TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT 'appointments'::TEXT, COUNT(*)::BIGINT, 0::BIGINT, '0 bytes'::TEXT, '0 bytes'::TEXT, NULL::TEXT FROM public.appointments;
END;
$$;

-- Create archive_old_data RPC
CREATE OR REPLACE FUNCTION public.archive_old_data(retention_months INTEGER DEFAULT 12)
RETURNS TABLE (
  table_name TEXT,
  records_archived BIGINT,
  partitions_dropped BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT 'appointments'::TEXT, 0::BIGINT, 0::BIGINT;
END;
$$;

-- Create cleanup_ancient_archives RPC
CREATE OR REPLACE FUNCTION public.cleanup_ancient_archives(years_to_keep INTEGER DEFAULT 5)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 0;
END;
$$;

-- Create get_barbershop_performance_stats RPC
CREATE OR REPLACE FUNCTION public.get_barbershop_performance_stats(barbershop_uuid UUID)
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 'appointments_today'::TEXT, COUNT(*)::NUMERIC
  FROM public.appointments
  WHERE barbershop_id = barbershop_uuid AND appointment_date = CURRENT_DATE
  UNION ALL
  SELECT 'sales_today'::TEXT, COUNT(*)::NUMERIC
  FROM public.sales
  WHERE barbershop_id = barbershop_uuid AND sale_date = CURRENT_DATE
  UNION ALL
  SELECT 'commands_open'::TEXT, COUNT(*)::NUMERIC
  FROM public.commands
  WHERE barbershop_id = barbershop_uuid AND status = 'open';
END;
$$;

-- Create get_connection_stats RPC (for PostgreSQL monitoring)
CREATE OR REPLACE FUNCTION public.get_connection_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN '{}'::JSON;
END;
$$;

-- Create get_memory_stats RPC
CREATE OR REPLACE FUNCTION public.get_memory_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN '{}'::JSON;
END;
$$;

-- Create get_slow_queries RPC
CREATE OR REPLACE FUNCTION public.get_slow_queries()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN '[]'::JSON;
END;
$$;

-- Create get_lock_stats RPC
CREATE OR REPLACE FUNCTION public.get_lock_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN '[]'::JSON;
END;
$$;

-- Create get_optimization_recommendations RPC
CREATE OR REPLACE FUNCTION public.get_optimization_recommendations()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN '[]'::JSON;
END;
$$;
