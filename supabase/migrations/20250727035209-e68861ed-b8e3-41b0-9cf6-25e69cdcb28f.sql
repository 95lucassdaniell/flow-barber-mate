-- Criar histórico de agendamentos e vendas para testar IA Preditiva
-- Usar dados dos barbeiros, serviços, produtos e clientes já existentes

-- Primeiro, vamos obter os IDs dos barbeiros, serviços e clientes para usar nos agendamentos
-- 6. Criar histórico de agendamentos dos últimos 6 meses (300 agendamentos)
WITH barber_ids AS (
  SELECT id, full_name FROM profiles WHERE role = 'barber' AND barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' LIMIT 8
),
service_ids AS (
  SELECT id, name, duration_minutes FROM services WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' LIMIT 15
),
client_ids AS (
  SELECT id, name FROM clients WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' LIMIT 80
),
provider_service_prices AS (
  SELECT ps.provider_id, ps.service_id, ps.price 
  FROM provider_services ps
  WHERE ps.provider_id IN (SELECT id FROM barber_ids)
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
  (SELECT id FROM client_ids OFFSET floor(random() * 80)::int LIMIT 1) as client_id,
  b.id as barber_id,
  s.id as service_id,
  CURRENT_DATE - (random() * 180)::int as appointment_date,
  (ARRAY['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'])[floor(random() * 16 + 1)] as start_time,
  (ARRAY['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'])[floor(random() * 16 + 1)]::time + (s.duration_minutes || ' minutes')::interval as end_time,
  COALESCE(psp.price, 35.00) as total_price,
  (ARRAY['completed', 'completed', 'completed', 'completed', 'cancelled', 'no_show'])[floor(random() * 6 + 1)] as status,
  '3fa85f64-5717-4562-b3fc-2c963f66afa6' as barbershop_id,
  CASE 
    WHEN random() < 0.3 THEN 'Cliente satisfeito'
    WHEN random() < 0.1 THEN 'Pediu desconto'
    ELSE NULL
  END as notes
FROM barber_ids b
CROSS JOIN service_ids s
LEFT JOIN provider_service_prices psp ON b.id = psp.provider_id AND s.id = psp.service_id
WHERE random() < 0.05; -- Isso criará aproximadamente 300 registros (8 * 15 * 0.05 * 50)

-- 7. Criar histórico de vendas dos últimos 6 meses (200 vendas)
WITH barber_ids AS (
  SELECT id, full_name FROM profiles WHERE role = 'barber' AND barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
),
client_ids AS (
  SELECT id, name FROM clients WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
),
service_ids AS (
  SELECT id, name FROM services WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
),
product_ids AS (
  SELECT id, name, selling_price, commission_rate FROM products WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' AND is_active = true
),
admin_id AS (
  SELECT id FROM profiles WHERE role = 'admin' AND barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' LIMIT 1
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
  (SELECT id FROM client_ids OFFSET floor(random() * (SELECT COUNT(*) FROM client_ids))::int LIMIT 1) as client_id,
  (SELECT id FROM barber_ids OFFSET floor(random() * (SELECT COUNT(*) FROM barber_ids))::int LIMIT 1) as barber_id,
  (SELECT id FROM admin_id) as created_by,
  CURRENT_DATE - (random() * 180)::int as sale_date,
  (ARRAY['08:30', '09:15', '10:00', '10:45', '11:30', '14:15', '15:00', '15:45', '16:30', '17:15'])[floor(random() * 10 + 1)]::time as sale_time,
  (random() * 200 + 30)::numeric(10,2) as total_amount,
  CASE WHEN random() < 0.2 THEN (random() * 20)::numeric(10,2) ELSE 0 END as discount_amount,
  0 as final_amount, -- Will be updated after inserting sale items
  (ARRAY['cash', 'card', 'pix', 'multiple'])[floor(random() * 4 + 1)] as payment_method,
  'paid' as payment_status,
  '3fa85f64-5717-4562-b3fc-2c963f66afa6' as barbershop_id,
  CASE 
    WHEN random() < 0.1 THEN 'Cliente fiel'
    WHEN random() < 0.05 THEN 'Primeira compra'
    ELSE NULL
  END as notes
FROM generate_series(1, 200);