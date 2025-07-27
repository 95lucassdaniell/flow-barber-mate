-- Limpar tentativas anteriores de particionamento
DROP TABLE IF EXISTS public.appointments_partitioned CASCADE;
DROP TABLE IF EXISTS public.sales_partitioned CASCADE;
DROP TABLE IF EXISTS public.commands_partitioned CASCADE;

-- ===================================
-- FASE 2: PARTICIONAMENTO DE TABELAS - ESTRUTURA CORRIGIDA
-- ===================================

-- Passo 1: Criar tabela appointments particionada com estrutura exata
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

-- Passo 2: Criar tabela sales particionada com estrutura exata
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

-- Passo 3: Criar tabela commands particionada com estrutura exata
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

-- Passo 4: Criar partições para últimos 6 meses e próximos 6 meses
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