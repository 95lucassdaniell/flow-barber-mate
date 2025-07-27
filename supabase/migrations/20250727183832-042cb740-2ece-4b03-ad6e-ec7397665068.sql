-- PLANO COMPLETO: Gerar dados históricos completos para Barberia Vargas (FINAL CORRIGIDO)
-- Meta: 200 clientes, 1700 históricos + 300 futuros = 2000 agendamentos totais

-- FASE 1: Adicionar 78 clientes para chegar a 200 total
INSERT INTO public.clients (barbershop_id, name, phone, email, birth_date, created_at, updated_at)
SELECT 
  '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'::uuid,
  CASE 
    WHEN n % 25 = 1 THEN 'João Silva'
    WHEN n % 25 = 2 THEN 'Maria Santos'
    WHEN n % 25 = 3 THEN 'Pedro Oliveira'
    WHEN n % 25 = 4 THEN 'Ana Costa'
    WHEN n % 25 = 5 THEN 'Carlos Ferreira'
    WHEN n % 25 = 6 THEN 'Lucia Rodrigues'
    WHEN n % 25 = 7 THEN 'Rafael Almeida'
    WHEN n % 25 = 8 THEN 'Fernanda Lima'
    WHEN n % 25 = 9 THEN 'Bruno Souza'
    WHEN n % 25 = 10 THEN 'Patricia Gomes'
    WHEN n % 25 = 11 THEN 'Diego Martins'
    WHEN n % 25 = 12 THEN 'Camila Rocha'
    WHEN n % 25 = 13 THEN 'Thiago Barbosa'
    WHEN n % 25 = 14 THEN 'Juliana Pereira'
    WHEN n % 25 = 15 THEN 'Marcelo Dias'
    WHEN n % 25 = 16 THEN 'Roberta Castro'
    WHEN n % 25 = 17 THEN 'Leonardo Ramos'
    WHEN n % 25 = 18 THEN 'Vanessa Cardoso'
    WHEN n % 25 = 19 THEN 'Gabriel Nascimento'
    WHEN n % 25 = 20 THEN 'Amanda Teixeira'
    WHEN n % 25 = 21 THEN 'Felipe Mendes'
    WHEN n % 25 = 22 THEN 'Carla Ribeiro'
    WHEN n % 25 = 23 THEN 'Ricardo Moura'
    WHEN n % 25 = 24 THEN 'Daniela Freitas'
    WHEN n % 25 = 0 THEN 'Anderson Cruz'
    ELSE 'Cliente ' || n::text
  END as name,
  '+55 11 9' || LPAD((8000 + n)::text, 4, '0') || '-' || LPAD((1000 + n)::text, 4, '0') as phone,
  CASE WHEN n % 3 = 0 THEN 'cliente' || n || '@email.com' ELSE NULL END as email,
  ('1980-01-01'::date + (n * 30 + FLOOR(random() * 365))::int) as birth_date,
  ('2024-07-01'::timestamp + (random() * interval '150 days')) as created_at,
  ('2024-07-01'::timestamp + (random() * interval '150 days')) as updated_at
FROM generate_series(123, 200) as n;

-- FASE 2: Gerar agendamentos históricos e futuros usando IDs corretos
DO $$
DECLARE
  barber_ids uuid[];
  service_ids uuid[];
  client_ids uuid[];
  barbershop_uuid uuid := '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'::uuid;
BEGIN
  -- Buscar IDs reais
  SELECT array_agg(id) INTO barber_ids
  FROM public.profiles 
  WHERE barbershop_id = barbershop_uuid 
  AND role = 'barber';
  
  SELECT array_agg(id) INTO service_ids
  FROM public.services 
  WHERE barbershop_id = barbershop_uuid;
  
  SELECT array_agg(id) INTO client_ids
  FROM public.clients 
  WHERE barbershop_id = barbershop_uuid;

  -- 2A: Gerar 1195 agendamentos CONCLUÍDOS adicionais (para totalizar 1275)
  INSERT INTO public.appointments (
    barbershop_id, client_id, barber_id, service_id,
    appointment_date, start_time, end_time, total_price,
    status, created_at, updated_at
  )
  SELECT 
    barbershop_uuid,
    client_ids[1 + (n % array_length(client_ids, 1))],
    barber_ids[1 + (n % array_length(barber_ids, 1))],
    service_ids[1 + (n % array_length(service_ids, 1))],
    ('2024-07-01'::date + (random() * 153)::int) as appointment_date,
    ('09:00'::time + (FLOOR(random() * 54) * interval '10 minutes')) as start_time,
    ('09:30'::time + (FLOOR(random() * 54) * interval '10 minutes')) as end_time,
    (20 + random() * 80)::numeric(10,2) as total_price,
    'completed' as status,
    ('2024-07-01'::timestamp + (random() * interval '153 days')) as created_at,
    ('2024-07-01'::timestamp + (random() * interval '153 days')) as updated_at
  FROM generate_series(1, 1195) as n;

  -- 2B: Gerar 255 agendamentos CANCELADOS
  INSERT INTO public.appointments (
    barbershop_id, client_id, barber_id, service_id,
    appointment_date, start_time, end_time, total_price,
    status, created_at, updated_at
  )
  SELECT 
    barbershop_uuid,
    client_ids[1 + (n % array_length(client_ids, 1))],
    barber_ids[1 + (n % array_length(barber_ids, 1))],
    service_ids[1 + (n % array_length(service_ids, 1))],
    ('2024-07-01'::date + (random() * 153)::int) as appointment_date,
    ('09:00'::time + (FLOOR(random() * 54) * interval '10 minutes')) as start_time,
    ('09:30'::time + (FLOOR(random() * 54) * interval '10 minutes')) as end_time,
    (20 + random() * 80)::numeric(10,2) as total_price,
    'cancelled' as status,
    ('2024-07-01'::timestamp + (random() * interval '153 days')) as created_at,
    ('2024-07-01'::timestamp + (random() * interval '153 days')) as updated_at
  FROM generate_series(1, 255) as n;

  -- 2C: Gerar 170 agendamentos AGENDADOS (passado mas ainda com status scheduled)
  INSERT INTO public.appointments (
    barbershop_id, client_id, barber_id, service_id,
    appointment_date, start_time, end_time, total_price,
    status, created_at, updated_at
  )
  SELECT 
    barbershop_uuid,
    client_ids[1 + (n % array_length(client_ids, 1))],
    barber_ids[1 + (n % array_length(barber_ids, 1))],
    service_ids[1 + (n % array_length(service_ids, 1))],
    ('2024-07-01'::date + (random() * 153)::int) as appointment_date,
    ('09:00'::time + (FLOOR(random() * 54) * interval '10 minutes')) as start_time,
    ('09:30'::time + (FLOOR(random() * 54) * interval '10 minutes')) as end_time,
    (20 + random() * 80)::numeric(10,2) as total_price,
    'scheduled' as status,
    ('2024-07-01'::timestamp + (random() * interval '153 days')) as created_at,
    ('2024-07-01'::timestamp + (random() * interval '153 days')) as updated_at
  FROM generate_series(1, 170) as n;

  -- FASE 3: Gerar 300 agendamentos FUTUROS (janeiro-fevereiro 2025)
  INSERT INTO public.appointments (
    barbershop_id, client_id, barber_id, service_id,
    appointment_date, start_time, end_time, total_price,
    status, created_at, updated_at
  )
  SELECT 
    barbershop_uuid,
    client_ids[1 + (n % array_length(client_ids, 1))],
    barber_ids[1 + (n % array_length(barber_ids, 1))],
    service_ids[1 + (n % array_length(service_ids, 1))],
    ('2025-01-01'::date + (random() * 59)::int) as appointment_date,
    ('09:00'::time + (FLOOR(random() * 54) * interval '10 minutes')) as start_time,
    ('09:30'::time + (FLOOR(random() * 54) * interval '10 minutes')) as end_time,
    (20 + random() * 80)::numeric(10,2) as total_price,
    'scheduled' as status,
    now() as created_at,
    now() as updated_at
  FROM generate_series(1, 300) as n;

  -- Aguardar triggers processarem
  PERFORM pg_sleep(3);
  
  -- FASE 4: Fechar comandos dos agendamentos concluídos
  UPDATE public.commands 
  SET 
    status = 'closed',
    payment_status = 'paid',
    payment_method = CASE 
      WHEN MOD(command_number::int, 4) = 0 THEN 'cash'
      WHEN MOD(command_number::int, 4) = 1 THEN 'card'
      WHEN MOD(command_number::int, 4) = 2 THEN 'pix'
      ELSE 'multiple'
    END,
    closed_at = (SELECT updated_at FROM public.appointments WHERE id = commands.appointment_id)
  WHERE barbershop_id = barbershop_uuid
  AND status = 'open'
  AND appointment_id IN (
    SELECT id FROM public.appointments 
    WHERE barbershop_id = barbershop_uuid
    AND status = 'completed'
  );

  -- FASE 5: Criar vendas para comandos fechados
  INSERT INTO public.sales (
    barbershop_id, client_id, barber_id, 
    sale_date, sale_time, total_amount, discount_amount, final_amount,
    payment_method, payment_status, notes, created_by,
    created_at, updated_at
  )
  SELECT DISTINCT
    c.barbershop_id,
    c.client_id,
    c.barber_id,
    a.appointment_date as sale_date,
    a.end_time as sale_time,
    c.total_amount,
    CASE WHEN random() < 0.1 THEN (c.total_amount * 0.1) ELSE 0 END as discount_amount,
    CASE WHEN random() < 0.1 THEN (c.total_amount * 0.9) ELSE c.total_amount END as final_amount,
    c.payment_method,
    'paid' as payment_status,
    'Venda histórica - Agendamento concluído' as notes,
    c.barber_id as created_by,
    c.closed_at as created_at,
    c.closed_at as updated_at
  FROM public.commands c
  JOIN public.appointments a ON c.appointment_id = a.id
  WHERE c.barbershop_id = barbershop_uuid
  AND c.status = 'closed'
  AND c.payment_status = 'paid'
  AND a.status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM public.sales s 
    WHERE s.barbershop_id = c.barbershop_id 
    AND s.client_id = c.client_id 
    AND s.barber_id = c.barber_id
    AND s.sale_date = a.appointment_date
    AND ABS(s.total_amount - c.total_amount) < 0.01
  );
END $$;

-- FASE 6: Relatório final
SELECT 'DADOS HISTÓRICOS GERADOS COM SUCESSO!' as resultado;

SELECT 
  'TOTAIS' as categoria,
  (SELECT COUNT(*) FROM public.clients WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as clientes,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as agendamentos,
  (SELECT COUNT(*) FROM public.commands WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as comandos,
  (SELECT COUNT(*) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as vendas;

SELECT 
  'STATUS DOS AGENDAMENTOS' as categoria,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'completed') as concluidos,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'cancelled') as cancelados,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'scheduled') as agendados;

SELECT 
  'PERÍODO' as categoria,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND appointment_date < '2025-01-01') as historicos_jul_dez_2024,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND appointment_date >= '2025-01-01') as futuros_jan_fev_2025;

SELECT 
  'PERCENTUAIS' as categoria,
  ROUND((SELECT COUNT(*)::numeric FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'completed' AND appointment_date < '2025-01-01') / 
        (SELECT COUNT(*)::numeric FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND appointment_date < '2025-01-01') * 100, 1) as pct_concluidos,
  ROUND((SELECT COUNT(*)::numeric FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'cancelled' AND appointment_date < '2025-01-01') / 
        (SELECT COUNT(*)::numeric FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND appointment_date < '2025-01-01') * 100, 1) as pct_cancelados,
  ROUND((SELECT COUNT(*)::numeric FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'scheduled' AND appointment_date < '2025-01-01') / 
        (SELECT COUNT(*)::numeric FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND appointment_date < '2025-01-01') * 100, 1) as pct_agendados;

SELECT 
  'RECEITA' as categoria,
  (SELECT COALESCE(SUM(final_amount), 0) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as receita_total_reais,
  (SELECT COUNT(*) FROM public.commands WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'closed') as comandos_fechados;