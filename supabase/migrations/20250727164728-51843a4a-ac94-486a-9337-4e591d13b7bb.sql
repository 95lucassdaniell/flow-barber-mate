-- Limpar e recriar tabelas particionadas com triggers para updated_at

-- Remover tabelas particionadas existentes
DROP TABLE IF EXISTS public.appointments_partitioned CASCADE;
DROP TABLE IF EXISTS public.sales_partitioned CASCADE; 
DROP TABLE IF EXISTS public.commands_partitioned CASCADE;

-- Recriar tabelas particionadas com triggers para updated_at
CREATE TABLE public.appointments_partitioned (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    barbershop_id uuid NOT NULL,
    client_id uuid NOT NULL,
    barber_id uuid NOT NULL,
    service_id uuid NOT NULL,
    appointment_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    status text NOT NULL DEFAULT 'scheduled'::text,
    total_price numeric NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
) PARTITION BY RANGE (appointment_date);

CREATE TABLE public.sales_partitioned (
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
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    cash_register_id uuid
) PARTITION BY RANGE (sale_date);

CREATE TABLE public.commands_partitioned (
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

-- Criar triggers para updated_at
CREATE TRIGGER update_appointments_updated_at 
BEFORE UPDATE ON public.appointments_partitioned
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at 
BEFORE UPDATE ON public.sales_partitioned
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commands_updated_at 
BEFORE UPDATE ON public.commands_partitioned
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar partições
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

-- Migrar dados com tratamento de null
INSERT INTO public.appointments_partitioned 
SELECT 
    id, barbershop_id, client_id, barber_id, service_id, appointment_date, 
    start_time, end_time, status, total_price, notes, created_at,
    COALESCE(updated_at, created_at) as updated_at
FROM public.appointments;

INSERT INTO public.sales_partitioned 
SELECT 
    id, barbershop_id, client_id, barber_id, sale_date, sale_time,
    total_amount, discount_amount, final_amount, payment_method, 
    payment_status, notes, created_by, created_at,
    COALESCE(updated_at, created_at) as updated_at, cash_register_id
FROM public.sales;

INSERT INTO public.commands_partitioned 
SELECT 
    id, command_number, appointment_id, client_id, barber_id, barbershop_id,
    status, total_amount, payment_method, payment_status, notes,
    created_at, COALESCE(updated_at, created_at) as updated_at, closed_at
FROM public.commands;