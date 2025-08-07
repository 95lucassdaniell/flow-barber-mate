-- Corrigir as funções restantes que ainda não têm search_path configurado corretamente
-- Baseando-se nos warnings anteriores, vou corrigir as funções específicas

-- Verificar se existe a função update_barbershop_stats
DROP FUNCTION IF EXISTS public.update_barbershop_stats();

CREATE OR REPLACE FUNCTION public.update_barbershop_stats()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  UPDATE public.barbershops 
  SET 
    total_users = (
      SELECT COUNT(*) 
      FROM public.profiles 
      WHERE barbershop_id = barbershops.id
    ),
    total_appointments = (
      SELECT COUNT(*) 
      FROM public.appointments 
      WHERE barbershop_id = barbershops.id
    );
$function$;

-- Verificar se existe a função get_financial_overview
DROP FUNCTION IF EXISTS public.get_financial_overview();

CREATE OR REPLACE FUNCTION public.get_financial_overview()
 RETURNS TABLE(total_active_accounts integer, total_trial_accounts integer, total_overdue_accounts integer, total_cancelled_accounts integer, monthly_revenue numeric, annual_revenue numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT 
    COUNT(*) FILTER (WHERE payment_status = 'current') AS total_active_accounts,
    COUNT(*) FILTER (WHERE payment_status = 'trial') AS total_trial_accounts,
    COUNT(*) FILTER (WHERE payment_status = 'overdue') AS total_overdue_accounts,
    COUNT(*) FILTER (WHERE payment_status = 'cancelled') AS total_cancelled_accounts,
    COALESCE(SUM(monthly_revenue) FILTER (WHERE payment_status = 'current'), 0) AS monthly_revenue,
    COALESCE(SUM(monthly_revenue) FILTER (WHERE payment_status = 'current'), 0) * 12 AS annual_revenue
  FROM public.barbershops;
$function$;