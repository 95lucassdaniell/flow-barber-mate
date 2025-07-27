-- Criar histórico de agendamentos e vendas para testar IA Preditiva
-- Versão simplificada

-- 4. Criar agendamentos históricos dos últimos 6 meses
WITH admin_profile AS (
  SELECT id FROM profiles WHERE role = 'admin' AND barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' LIMIT 1
),
service_list AS (
  SELECT id, name FROM services WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
),
client_list AS (
  SELECT id, name FROM clients WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
),
appointment_combinations AS (
  SELECT 
    c.id as client_id,
    ap.id as barber_id,
    s.id as service_id,
    s.name as service_name,
    row_number() OVER () as rn
  FROM admin_profile ap
  CROSS JOIN client_list c
  CROSS JOIN service_list s
)
INSERT INTO public.appointments (
  client_id,
  barber_id,
  service_id,
  appointment_date,
  start_time,
  end_time,
  total_price,
  status,
  barbershop_id,
  notes
)
SELECT 
  ac.client_id,
  ac.barber_id,
  ac.service_id,
  (CURRENT_DATE - (ac.rn % 180)::int) as appointment_date,
  ('08:00'::time + ((ac.rn % 18) * interval '30 minutes')) as start_time,
  ('08:00'::time + ((ac.rn % 18) * interval '30 minutes') + interval '45 minutes') as end_time,
  CASE ac.service_name
    WHEN 'Corte Masculino' THEN 35.00
    WHEN 'Corte + Barba' THEN 55.00
    WHEN 'Barba' THEN 25.00
    WHEN 'Degradê' THEN 40.00
    WHEN 'Platinado' THEN 150.00
    WHEN 'Lavagem + Corte' THEN 45.00
    WHEN 'Sobrancelha' THEN 15.00
    WHEN 'Relaxamento' THEN 85.00
    ELSE 35.00
  END as total_price,
  CASE 
    WHEN (ac.rn % 20) = 0 THEN 'cancelled'
    WHEN (ac.rn % 25) = 0 THEN 'no_show'
    ELSE 'completed'
  END as status,
  '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'::uuid as barbershop_id,
  CASE 
    WHEN (ac.rn % 10) = 0 THEN 'Cliente satisfeito'
    WHEN (ac.rn % 15) = 0 THEN 'Reagendou'
    ELSE NULL
  END as notes
FROM appointment_combinations ac
WHERE ac.rn <= 80; -- Criar 80 agendamentos

-- 5. Criar vendas históricas dos últimos 6 meses
WITH admin_profile AS (
  SELECT id FROM profiles WHERE role = 'admin' AND barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' LIMIT 1
),
client_list AS (
  SELECT id, name FROM clients WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
),
sale_combinations AS (
  SELECT 
    c.id as client_id,
    ap.id as admin_id,
    row_number() OVER () as rn
  FROM admin_profile ap
  CROSS JOIN client_list c
)
INSERT INTO public.sales (
  client_id,
  barber_id,
  created_by,
  sale_date,
  sale_time,
  total_amount,
  discount_amount,
  final_amount,
  payment_method,
  payment_status,
  barbershop_id,
  notes
)
SELECT 
  sc.client_id,
  sc.admin_id as barber_id,
  sc.admin_id as created_by,
  (CURRENT_DATE - (sc.rn % 120)::int) as sale_date,
  ('09:00'::time + ((sc.rn % 16) * interval '30 minutes')) as sale_time,
  (40 + (sc.rn % 160))::numeric(10,2) as total_amount,
  CASE WHEN (sc.rn % 15) = 0 THEN (5 + (sc.rn % 10))::numeric(10,2) ELSE 0.00 END as discount_amount,
  (40 + (sc.rn % 160) - CASE WHEN (sc.rn % 15) = 0 THEN (5 + (sc.rn % 10)) ELSE 0 END)::numeric(10,2) as final_amount,
  (ARRAY['cash', 'card', 'pix', 'multiple'])[((sc.rn % 4) + 1)] as payment_method,
  CASE WHEN (sc.rn % 50) = 0 THEN 'pending' ELSE 'paid' END as payment_status,
  '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'::uuid as barbershop_id,
  CASE 
    WHEN (sc.rn % 12) = 0 THEN 'Cliente fiel'
    WHEN (sc.rn % 20) = 0 THEN 'Primeira compra'
    WHEN (sc.rn % 30) = 0 THEN 'Compra premium'
    ELSE NULL
  END as notes
FROM sale_combinations sc
WHERE sc.rn <= 60; -- Criar 60 vendas