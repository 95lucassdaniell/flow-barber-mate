
-- Make provider_id nullable on schedule_blocks since blocks can be for the whole barbershop
ALTER TABLE public.schedule_blocks ALTER COLUMN provider_id DROP NOT NULL;
