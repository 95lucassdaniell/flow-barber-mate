-- Habilitar RLS nas tabelas particionadas que não têm
-- Estas tabelas foram criadas automaticamente e não herdaram as políticas RLS

-- Appointments particionados
ALTER TABLE public.appointments_partitioned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_05 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_06 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_07 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_08 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_partitioned_2025_10 ENABLE ROW LEVEL SECURITY;

-- Commands particionados
ALTER TABLE public.commands_partitioned ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_05 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_06 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_07 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_08 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_09 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands_partitioned_2025_10 ENABLE ROW LEVEL SECURITY;