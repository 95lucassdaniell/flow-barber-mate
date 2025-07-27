-- PLANO COMPLETO: Gerar dados históricos completos para Barberia Vargas
-- Meta: 200 clientes, 1700 históricos + 300 futuros = 2000 agendamentos totais

-- FASE 1: Adicionar 78 clientes para chegar a 200 total
INSERT INTO public.clients (barbershop_id, name, phone, email, birth_date, created_at, updated_at)
SELECT 
  '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a',
  CASE 
    WHEN n % 100 = 1 THEN 'João Silva'
    WHEN n % 100 = 2 THEN 'Maria Santos'
    WHEN n % 100 = 3 THEN 'Pedro Oliveira'
    WHEN n % 100 = 4 THEN 'Ana Costa'
    WHEN n % 100 = 5 THEN 'Carlos Ferreira'
    WHEN n % 100 = 6 THEN 'Lucia Rodrigues'
    WHEN n % 100 = 7 THEN 'Rafael Almeida'
    WHEN n % 100 = 8 THEN 'Fernanda Lima'
    WHEN n % 100 = 9 THEN 'Bruno Souza'
    WHEN n % 100 = 10 THEN 'Patricia Gomes'
    WHEN n % 100 = 11 THEN 'Diego Martins'
    WHEN n % 100 = 12 THEN 'Camila Rocha'
    WHEN n % 100 = 13 THEN 'Thiago Barbosa'
    WHEN n % 100 = 14 THEN 'Juliana Pereira'
    WHEN n % 100 = 15 THEN 'Marcelo Dias'
    WHEN n % 100 = 16 THEN 'Roberta Castro'
    WHEN n % 100 = 17 THEN 'Leonardo Ramos'
    WHEN n % 100 = 18 THEN 'Vanessa Cardoso'
    WHEN n % 100 = 19 THEN 'Gabriel Nascimento'
    WHEN n % 100 = 20 THEN 'Amanda Teixeira'
    WHEN n % 100 = 21 THEN 'Felipe Mendes'
    WHEN n % 100 = 22 THEN 'Carla Ribeiro'
    WHEN n % 100 = 23 THEN 'Ricardo Moura'
    WHEN n % 100 = 24 THEN 'Daniela Freitas'
    WHEN n % 100 = 25 THEN 'Anderson Cruz'
    ELSE 'Cliente ' || n::text
  END as name,
  '+55 11 9' || LPAD((8000 + n)::text, 4, '0') || '-' || LPAD((1000 + n)::text, 4, '0') as phone,
  CASE WHEN n % 3 = 0 THEN 'cliente' || n || '@email.com' ELSE NULL END as email,
  ('1980-01-01'::date + (n * 30 + FLOOR(random() * 365))::int) as birth_date,
  ('2024-07-01'::timestamp + (random() * interval '150 days')) as created_at,
  ('2024-07-01'::timestamp + (random() * interval '150 days')) as updated_at
FROM generate_series(123, 200) as n;

-- FASE 2: Gerar 1620 agendamentos históricos adicionais (julho 2024 - dezembro 2024)
-- Total será 1700 históricos: 1275 concluídos (75%) + 255 cancelados (15%) + 170 agendados (10%)

-- 2A: Gerar 1195 agendamentos CONCLUÍDOS adicionais (para totalizar 1275)
INSERT INTO public.appointments (
  barbershop_id, client_id, barber_id, service_id,
  appointment_date, start_time, end_time, total_price,
  status, created_at, updated_at
)
SELECT 
  '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a',
  clients.id,
  CASE (n % 3)
    WHEN 0 THEN '00d6cc20-13b6-474b-85f7-ec0bf4eec6e1'
    WHEN 1 THEN '59fb0e5a-3ed9-46fd-8e30-62e5fe3b8f16' 
    ELSE '6e147c65-5e80-45b8-95b8-4a8e2a4c5f11'
  END as barber_id,
  services.id as service_id,
  ('2024-07-01'::date + (random() * 153)::int) as appointment_date,
  ('09:00'::time + (FLOOR(random() * 54) * interval '10 minutes')) as start_time,
  ('09:30'::time + (FLOOR(random() * 54) * interval '10 minutes')) as end_time,
  (20 + random() * 80)::numeric(10,2) as total_price,
  'completed' as status,
  ('2024-07-01'::timestamp + (random() * interval '153 days')) as created_at,
  ('2024-07-01'::timestamp + (random() * interval '153 days')) as updated_at
FROM generate_series(1, 1195) as n
CROSS JOIN (SELECT id FROM public.clients WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' ORDER BY random() LIMIT 1) as clients
CROSS JOIN (SELECT id FROM public.services WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' ORDER BY random() LIMIT 1) as services;

-- 2B: Gerar 255 agendamentos CANCELADOS
INSERT INTO public.appointments (
  barbershop_id, client_id, barber_id, service_id,
  appointment_date, start_time, end_time, total_price,
  status, created_at, updated_at
)
SELECT 
  '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a',
  clients.id,
  CASE (n % 3)
    WHEN 0 THEN '00d6cc20-13b6-474b-85f7-ec0bf4eec6e1'
    WHEN 1 THEN '59fb0e5a-3ed9-46fd-8e30-62e5fe3b8f16' 
    ELSE '6e147c65-5e80-45b8-95b8-4a8e2a4c5f11'
  END as barber_id,
  services.id as service_id,
  ('2024-07-01'::date + (random() * 153)::int) as appointment_date,
  ('09:00'::time + (FLOOR(random() * 54) * interval '10 minutes')) as start_time,
  ('09:30'::time + (FLOOR(random() * 54) * interval '10 minutes')) as end_time,
  (20 + random() * 80)::numeric(10,2) as total_price,
  'cancelled' as status,
  ('2024-07-01'::timestamp + (random() * interval '153 days')) as created_at,
  ('2024-07-01'::timestamp + (random() * interval '153 days')) as updated_at
FROM generate_series(1, 255) as n
CROSS JOIN (SELECT id FROM public.clients WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' ORDER BY random() LIMIT 1) as clients
CROSS JOIN (SELECT id FROM public.services WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' ORDER BY random() LIMIT 1) as services;

-- 2C: Gerar 170 agendamentos AGENDADOS (passado mas ainda com status scheduled)
INSERT INTO public.appointments (
  barbershop_id, client_id, barber_id, service_id,
  appointment_date, start_time, end_time, total_price,
  status, created_at, updated_at
)
SELECT 
  '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a',
  clients.id,
  CASE (n % 3)
    WHEN 0 THEN '00d6cc20-13b6-474b-85f7-ec0bf4eec6e1'
    WHEN 1 THEN '59fb0e5a-3ed9-46fd-8e30-62e5fe3b8f16' 
    ELSE '6e147c65-5e80-45b8-95b8-4a8e2a4c5f11'
  END as barber_id,
  services.id as service_id,
  ('2024-07-01'::date + (random() * 153)::int) as appointment_date,
  ('09:00'::time + (FLOOR(random() * 54) * interval '10 minutes')) as start_time,
  ('09:30'::time + (FLOOR(random() * 54) * interval '10 minutes')) as end_time,
  (20 + random() * 80)::numeric(10,2) as total_price,
  'scheduled' as status,
  ('2024-07-01'::timestamp + (random() * interval '153 days')) as created_at,
  ('2024-07-01'::timestamp + (random() * interval '153 days')) as updated_at
FROM generate_series(1, 170) as n
CROSS JOIN (SELECT id FROM public.clients WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' ORDER BY random() LIMIT 1) as clients
CROSS JOIN (SELECT id FROM public.services WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' ORDER BY random() LIMIT 1) as services;

-- FASE 3: Gerar 300 agendamentos FUTUROS (janeiro-fevereiro 2025)
INSERT INTO public.appointments (
  barbershop_id, client_id, barber_id, service_id,
  appointment_date, start_time, end_time, total_price,
  status, created_at, updated_at
)
SELECT 
  '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a',
  clients.id,
  CASE (n % 3)
    WHEN 0 THEN '00d6cc20-13b6-474b-85f7-ec0bf4eec6e1'
    WHEN 1 THEN '59fb0e5a-3ed9-46fd-8e30-62e5fe3b8f16' 
    ELSE '6e147c65-5e80-45b8-95b8-4a8e2a4c5f11'
  END as barber_id,
  services.id as service_id,
  ('2025-01-01'::date + (random() * 59)::int) as appointment_date,
  ('09:00'::time + (FLOOR(random() * 54) * interval '10 minutes')) as start_time,
  ('09:30'::time + (FLOOR(random() * 54) * interval '10 minutes')) as end_time,
  (20 + random() * 80)::numeric(10,2) as total_price,
  'scheduled' as status,
  now() as created_at,
  now() as updated_at
FROM generate_series(1, 300) as n
CROSS JOIN (SELECT id FROM public.clients WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' ORDER BY random() LIMIT 1) as clients
CROSS JOIN (SELECT id FROM public.services WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' ORDER BY random() LIMIT 1) as services;

-- FASE 4: Aguardar triggers automáticos criarem comandos para novos agendamentos
-- Os triggers já existentes criarão comandos automaticamente

-- FASE 5: Fechar comandos dos agendamentos concluídos e criar vendas
-- Aguardar 1 segundo para os triggers processarem
SELECT pg_sleep(1);

-- Fechar comandos de agendamentos concluídos
UPDATE public.commands 
SET 
  status = 'closed',
  payment_status = 'paid',
  payment_method = CASE 
    WHEN MOD(command_number, 4) = 0 THEN 'cash'
    WHEN MOD(command_number, 4) = 1 THEN 'card'
    WHEN MOD(command_number, 4) = 2 THEN 'pix'
    ELSE 'multiple'
  END,
  closed_at = (SELECT updated_at FROM public.appointments WHERE id = commands.appointment_id)
WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
AND status = 'open'
AND appointment_id IN (
  SELECT id FROM public.appointments 
  WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' 
  AND status = 'completed'
);

-- Criar vendas para comandos fechados
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
  'Venda do agendamento #' || a.id as notes,
  c.barber_id as created_by,
  c.closed_at as created_at,
  c.closed_at as updated_at
FROM public.commands c
JOIN public.appointments a ON c.appointment_id = a.id
WHERE c.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
AND c.status = 'closed'
AND c.payment_status = 'paid'
AND a.status = 'completed'
AND c.id NOT IN (
  SELECT DISTINCT c2.id 
  FROM public.commands c2
  JOIN public.sales s ON (
    s.barbershop_id = c2.barbershop_id 
    AND s.client_id = c2.client_id 
    AND s.barber_id = c2.barber_id
    AND ABS(s.total_amount - c2.total_amount) < 0.01
    AND s.sale_date = (SELECT appointment_date FROM public.appointments WHERE id = c2.appointment_id)
  )
  WHERE c2.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
);

-- FASE 6: Verificação final e relatório
SELECT 'RELATÓRIO FINAL DOS DADOS HISTÓRICOS' as relatorio;

SELECT 
  'TOTAIS GERAIS' as categoria,
  (SELECT COUNT(*) FROM public.clients WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as clientes,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as agendamentos_total,
  (SELECT COUNT(*) FROM public.commands WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as comandos_total,
  (SELECT COUNT(*) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as vendas_total;

SELECT 
  'AGENDAMENTOS POR STATUS' as categoria,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'completed') as concluidos,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'cancelled') as cancelados,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'scheduled') as agendados;

SELECT 
  'AGENDAMENTOS POR PERÍODO' as categoria,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND appointment_date < '2025-01-01') as historicos,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND appointment_date >= '2025-01-01') as futuros;

SELECT 
  'FINANCEIRO' as categoria,
  (SELECT COALESCE(SUM(final_amount), 0) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as receita_total,
  (SELECT COALESCE(SUM(discount_amount), 0) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as descontos_total,
  (SELECT COUNT(*) FROM public.commands WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'closed') as comandos_fechados;