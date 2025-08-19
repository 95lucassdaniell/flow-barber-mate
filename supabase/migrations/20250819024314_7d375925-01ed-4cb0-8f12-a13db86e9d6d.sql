
-- 1) Tabela de bloqueios de agenda
create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null,
  provider_id uuid null, -- null = aplica a todos os barbeiros da barbearia
  title text not null default 'Bloqueio',
  description text null,
  -- Bloqueio pontual (usar block_date + horários)
  block_date date null,
  start_time time not null,
  end_time time not null,
  is_full_day boolean not null default false,
  -- Recorrência
  recurrence_type text not null default 'none', -- 'none' | 'weekly'
  days_of_week smallint[] null, -- 0=domingo ... 6=sábado
  start_date date null, -- janela opcional para recorrência
  end_date date null,
  status text not null default 'active', -- 'active' | 'inactive'
  created_by uuid null, -- auth.uid() no app
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists schedule_blocks_barbershop_idx on public.schedule_blocks (barbershop_id);
create index if not exists schedule_blocks_provider_idx on public.schedule_blocks (provider_id);
create index if not exists schedule_blocks_block_date_idx on public.schedule_blocks (block_date);
create index if not exists schedule_blocks_status_idx on public.schedule_blocks (status);
create index if not exists schedule_blocks_recurrence_idx on public.schedule_blocks (recurrence_type, start_date, end_date);

-- 2) Habilitar RLS
alter table public.schedule_blocks enable row level security;

-- 3) Políticas de leitura (todos da barbearia)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'schedule_blocks' and policyname = 'Users can view schedule blocks from their barbershop'
  ) then
    create policy "Users can view schedule blocks from their barbershop"
      on public.schedule_blocks
      for select
      using (barbershop_id = public.get_user_barbershop_id());
  end if;
end$$;

-- 4) Políticas de gestão para admin/recepção
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'schedule_blocks' and policyname = 'Admins and receptionists can manage schedule blocks'
  ) then
    create policy "Admins and receptionists can manage schedule blocks"
      on public.schedule_blocks
      for all
      using (
        barbershop_id = public.get_user_barbershop_id()
        and exists (
          select 1 from public.profiles p
          where p.user_id = auth.uid()
            and p.role = any(array['admin','receptionist'])
            and p.barbershop_id = public.get_user_barbershop_id()
        )
      )
      with check (
        barbershop_id = public.get_user_barbershop_id()
        and exists (
          select 1 from public.profiles p
          where p.user_id = auth.uid()
            and p.role = any(array['admin','receptionist'])
            and p.barbershop_id = public.get_user_barbershop_id()
        )
      );
  end if;
end$$;

-- 5) Políticas para barbeiros gerenciarem seus próprios bloqueios
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'schedule_blocks' and policyname = 'Barbers can manage their own schedule blocks'
  ) then
    create policy "Barbers can manage their own schedule blocks"
      on public.schedule_blocks
      for all
      using (
        barbershop_id = public.get_user_barbershop_id()
        and provider_id in (select id from public.profiles where user_id = auth.uid())
      )
      with check (
        barbershop_id = public.get_user_barbershop_id()
        and provider_id in (select id from public.profiles where user_id = auth.uid())
      );
  end if;
end$$;

-- 6) Trigger para updated_at
drop trigger if exists trg_schedule_blocks_updated_at on public.schedule_blocks;
create trigger trg_schedule_blocks_updated_at
before update on public.schedule_blocks
for each row execute function public.update_updated_at_column();

-- 7) Validações via trigger
create or replace function public.validate_schedule_block()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  -- End time must be after start time when not full day
  if (new.is_full_day = false) and (new.end_time <= new.start_time) then
    raise exception 'End time must be after start time';
  end if;

  -- Either single-day block or recurring
  if new.recurrence_type = 'none' then
    if new.block_date is null then
      raise exception 'block_date is required when recurrence_type = none';
    end if;
  elsif new.recurrence_type = 'weekly' then
    if new.days_of_week is null or array_length(new.days_of_week, 1) = 0 then
      raise exception 'days_of_week is required when recurrence_type = weekly';
    end if;
    -- Optionally ensure days_of_week values are in 0..6
    if exists (
      select 1
      from unnest(new.days_of_week) d
      where d < 0 or d > 6
    ) then
      raise exception 'days_of_week must contain values between 0 and 6';
    end if;
  else
    raise exception 'Unsupported recurrence_type: %', new.recurrence_type;
  end if;

  -- Validate date range
  if new.start_date is not null and new.end_date is not null and new.end_date < new.start_date then
    raise exception 'end_date must be on or after start_date';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_schedule_blocks_validate on public.schedule_blocks;
create trigger trg_schedule_blocks_validate
before insert or update on public.schedule_blocks
for each row execute function public.validate_schedule_block();
