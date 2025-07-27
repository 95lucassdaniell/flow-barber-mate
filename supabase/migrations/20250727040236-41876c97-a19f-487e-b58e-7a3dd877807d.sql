-- Criar histórico de agendamentos e vendas para testar IA Preditiva
-- Parte 2: Agendamentos e Vendas Históricos

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
WHERE ac.rn <= 150; -- Criar 150 agendamentos

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
WHERE sc.rn <= 100; -- Criar 100 vendas

-- 6. Criar itens de venda para as vendas criadas
WITH recent_sales AS (
  SELECT id, total_amount FROM sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
),
service_list AS (
  SELECT id, name FROM services WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
),
product_list AS (
  SELECT id, name, selling_price, commission_rate FROM products WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
),
sale_service_items AS (
  SELECT 
    rs.id as sale_id,
    sl.id as service_id,
    row_number() OVER () as rn
  FROM recent_sales rs
  CROSS JOIN service_list sl
  WHERE (rs.id::text || sl.id::text)::uuid::text ~ '^[0-9a-f]{8}' -- Pseudo-random selection
),
sale_product_items AS (
  SELECT 
    rs.id as sale_id,
    pl.id as product_id,
    pl.selling_price,
    pl.commission_rate,
    row_number() OVER () as rn
  FROM recent_sales rs
  CROSS JOIN product_list pl
  WHERE (rs.id::text || pl.id::text)::uuid::text ~ '^[0-9a-f]{8}' -- Pseudo-random selection
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
-- Serviços nas vendas (70% das vendas têm serviços)
SELECT 
  ssi.sale_id,
  'service' as item_type,
  ssi.service_id,
  NULL as product_id,
  1 as quantity,
  30.00 + (ssi.rn % 50) as unit_price,
  30.00 + (ssi.rn % 50) as total_price,
  0.35 as commission_rate,
  (30.00 + (ssi.rn % 50)) * 0.35 as commission_amount
FROM sale_service_items ssi
WHERE ssi.rn <= 70 -- 70 itens de serviço

UNION ALL

-- Produtos nas vendas (30% das vendas têm produtos)
SELECT 
  spi.sale_id,
  'product' as item_type,
  NULL as service_id,
  spi.product_id,
  (1 + (spi.rn % 3))::int as quantity,
  spi.selling_price as unit_price,
  spi.selling_price * (1 + (spi.rn % 3)) as total_price,
  spi.commission_rate,
  spi.selling_price * (1 + (spi.rn % 3)) * spi.commission_rate as commission_amount
FROM sale_product_items spi
WHERE spi.rn <= 30; -- 30 itens de produto

-- 7. Atualizar final_amount das vendas baseado nos itens reais
UPDATE sales 
SET final_amount = (
  SELECT COALESCE(SUM(total_price), total_amount) 
  FROM sale_items 
  WHERE sale_id = sales.id
) - discount_amount
WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a';