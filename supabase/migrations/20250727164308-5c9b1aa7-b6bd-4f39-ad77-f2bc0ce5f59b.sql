-- ===================================
-- FASE 2: PARTICIONAMENTO DE TABELAS - VERSÃO CORRIGIDA
-- ===================================

-- Passo 1: Criar tabela appointments particionada
CREATE TABLE public.appointments_partitioned (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    barber_id uuid NOT NULL,
    service_id uuid NOT NULL,
    barbershop_id uuid NOT NULL,
    appointment_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    status text NOT NULL DEFAULT 'scheduled'::text,
    total_price numeric NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
) PARTITION BY RANGE (appointment_date);

-- Passo 2: Criar tabela sales particionada
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
    cash_register_id uuid,
    created_by uuid NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
) PARTITION BY RANGE (sale_date);

-- Passo 3: Criar tabela commands particionada
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

-- Passo 4: Criar partições usando a função corrigida
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

-- Passo 5: Migrar dados existentes para as tabelas particionadas
INSERT INTO public.appointments_partitioned SELECT * FROM public.appointments;
INSERT INTO public.sales_partitioned SELECT * FROM public.sales;
INSERT INTO public.commands_partitioned SELECT * FROM public.commands;

-- Passo 6: Fazer backup das tabelas originais e substituir
ALTER TABLE public.appointments RENAME TO appointments_backup;
ALTER TABLE public.sales RENAME TO sales_backup;
ALTER TABLE public.commands RENAME TO commands_backup;

ALTER TABLE public.appointments_partitioned RENAME TO appointments;
ALTER TABLE public.sales_partitioned RENAME TO sales;
ALTER TABLE public.commands_partitioned RENAME TO commands;

-- Passo 7: Recriar constraints de chave primária compostas
ALTER TABLE public.appointments ADD CONSTRAINT appointments_pkey PRIMARY KEY (id, appointment_date);
ALTER TABLE public.sales ADD CONSTRAINT sales_pkey PRIMARY KEY (id, sale_date);
ALTER TABLE public.commands ADD CONSTRAINT commands_pkey PRIMARY KEY (id, created_at);

-- Passo 8: Recriar índices otimizados para particionamento
CREATE INDEX idx_appointments_barbershop_date_status_part ON public.appointments(barbershop_id, appointment_date, status);
CREATE INDEX idx_appointments_barber_date_part ON public.appointments(barber_id, appointment_date);
CREATE INDEX idx_appointments_client_part ON public.appointments(client_id, appointment_date);

CREATE INDEX idx_sales_barbershop_date_payment_part ON public.sales(barbershop_id, sale_date, payment_method);
CREATE INDEX idx_sales_barber_date_part ON public.sales(barber_id, sale_date);
CREATE INDEX idx_sales_client_part ON public.sales(client_id, sale_date);

CREATE INDEX idx_commands_barbershop_status_date_part ON public.commands(barbershop_id, status, created_at);
CREATE INDEX idx_commands_barber_status_part ON public.commands(barber_id, status);
CREATE INDEX idx_commands_appointment_part ON public.commands(appointment_id) WHERE appointment_id IS NOT NULL;

-- Passo 9: Recriar trigger para command_number
CREATE TRIGGER set_command_number_trigger
BEFORE INSERT ON public.commands
FOR EACH ROW
EXECUTE FUNCTION public.set_command_number();

-- Passo 10: Função para automação de partições futuras
CREATE OR REPLACE FUNCTION public.auto_create_monthly_partitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    next_month date;
BEGIN
    next_month := date_trunc('month', CURRENT_DATE + interval '7 months')::date;
    
    PERFORM create_monthly_partition('appointments', next_month);
    PERFORM create_monthly_partition('sales', next_month);
    PERFORM create_monthly_partition('commands', next_month);
    
    RAISE NOTICE 'Partições criadas para: %', next_month;
END;
$$;