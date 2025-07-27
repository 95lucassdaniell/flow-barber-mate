-- Criar histórico de agendamentos e vendas para testar IA Preditiva
-- Corrigindo conversão de UUID

-- 6. Criar histórico de agendamentos dos últimos 6 meses
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
),
appointments_data AS (
  SELECT 
    (SELECT id FROM client_ids OFFSET floor(random() * 80)::int LIMIT 1) as client_id,
    b.id as barber_id,
    s.id as service_id,
    (CURRENT_DATE - (random() * 180)::int) as appointment_date,
    ('08:00'::time + (floor(random() * 20) * interval '30 minutes')) as start_time,
    s.duration_minutes,
    COALESCE(psp.price, 35.00) as total_price,
    (ARRAY['completed', 'completed', 'completed', 'completed', 'cancelled', 'no_show'])[floor(random() * 6 + 1)] as status,
    '3fa85f64-5717-4562-b3fc-2c963f66afa6'::uuid as barbershop_id,
    CASE 
      WHEN random() < 0.3 THEN 'Cliente satisfeito'
      WHEN random() < 0.1 THEN 'Pediu desconto'
      ELSE NULL
    END as notes
  FROM barber_ids b
  CROSS JOIN service_ids s
  LEFT JOIN provider_service_prices psp ON b.id = psp.provider_id AND s.id = psp.service_id
  WHERE random() < 0.05
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
  client_id,
  barber_id,
  service_id,
  appointment_date,
  start_time,
  start_time + (duration_minutes || ' minutes')::interval as end_time,
  total_price,
  status,
  barbershop_id,
  notes
FROM appointments_data;

-- 7. Criar histórico de vendas dos últimos 6 meses
WITH barber_ids AS (
  SELECT id, full_name FROM profiles WHERE role = 'barber' AND barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
),
client_ids AS (
  SELECT id, name FROM clients WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
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
  (CURRENT_DATE - (random() * 180)::int) as sale_date,
  ('08:00'::time + (floor(random() * 20) * interval '30 minutes')) as sale_time,
  (random() * 200 + 30)::numeric(10,2) as total_amount,
  CASE WHEN random() < 0.2 THEN (random() * 20)::numeric(10,2) ELSE 0 END as discount_amount,
  0 as final_amount, -- Will be updated after inserting sale items
  (ARRAY['cash', 'card', 'pix', 'multiple'])[floor(random() * 4 + 1)] as payment_method,
  'paid' as payment_status,
  '3fa85f64-5717-4562-b3fc-2c963f66afa6'::uuid as barbershop_id,
  CASE 
    WHEN random() < 0.1 THEN 'Cliente fiel'
    WHEN random() < 0.05 THEN 'Primeira compra'
    ELSE NULL
  END as notes
FROM generate_series(1, 200);

-- 8. Criar itens de venda para as vendas criadas
WITH sales_data AS (
  SELECT id, total_amount FROM sales WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'::uuid
),
service_ids AS (
  SELECT id, name FROM services WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'::uuid
),
product_ids AS (
  SELECT id, name, selling_price, commission_rate FROM products WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'::uuid AND is_active = true
)
INSERT INTO public.sale_items (
  sale_id,
  item_type,
  service_id,
  product_id,
  quantity,
  unit_price,
  total_price,
  commission_rate,
  commission_amount
)
-- Serviços nas vendas
SELECT 
  s.id as sale_id,
  'service' as item_type,
  (SELECT id FROM service_ids OFFSET floor(random() * (SELECT COUNT(*) FROM service_ids))::int LIMIT 1) as service_id,
  NULL as product_id,
  1 as quantity,
  (s.total_amount * (0.6 + random() * 0.3))::numeric(10,2) as unit_price,
  (s.total_amount * (0.6 + random() * 0.3))::numeric(10,2) as total_price,
  0.35 as commission_rate,
  (s.total_amount * (0.6 + random() * 0.3) * 0.35)::numeric(10,2) as commission_amount
FROM sales_data s
WHERE random() < 0.8 -- 80% das vendas têm serviços

UNION ALL

-- Produtos nas vendas
SELECT 
  s.id as sale_id,
  'product' as item_type,
  NULL as service_id,
  p.id as product_id,
  (1 + floor(random() * 3))::int as quantity,
  p.selling_price as unit_price,
  (p.selling_price * (1 + floor(random() * 3)))::numeric(10,2) as total_price,
  p.commission_rate,
  (p.selling_price * (1 + floor(random() * 3)) * p.commission_rate)::numeric(10,2) as commission_amount
FROM sales_data s
CROSS JOIN product_ids p
WHERE random() < 0.03; -- Isso criará múltiplos produtos por venda aleatoriamente

-- 9. Atualizar final_amount nas vendas baseado nos itens
UPDATE sales 
SET final_amount = (
  SELECT COALESCE(SUM(total_price), total_amount) 
  FROM sale_items 
  WHERE sale_id = sales.id
) - discount_amount
WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'::uuid;