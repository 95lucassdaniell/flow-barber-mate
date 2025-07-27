-- Criar itens de venda simples para testar IA Preditiva

-- 6. Criar itens de venda para as vendas criadas
WITH recent_sales AS (
  SELECT id, total_amount, row_number() OVER () as rn FROM sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' ORDER BY created_at DESC LIMIT 40
),
service_list AS (
  SELECT id, name, row_number() OVER () as sn FROM services WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
),
product_list AS (
  SELECT id, name, selling_price, commission_rate, row_number() OVER () as pn FROM products WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
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
  rs.id as sale_id,
  'service' as item_type,
  (SELECT id FROM service_list WHERE sn = ((rs.rn % 8) + 1)) as service_id,
  NULL as product_id,
  1 as quantity,
  (30.00 + (rs.rn % 50))::numeric(10,2) as unit_price,
  (30.00 + (rs.rn % 50))::numeric(10,2) as total_price,
  0.35 as commission_rate,
  ((30.00 + (rs.rn % 50)) * 0.35)::numeric(10,2) as commission_amount
FROM recent_sales rs
WHERE rs.rn <= 30 -- 30 vendas com serviços

UNION ALL

-- Produtos nas vendas
SELECT 
  rs.id as sale_id,
  'product' as item_type,
  NULL as service_id,
  (SELECT id FROM product_list WHERE pn = ((rs.rn % 8) + 1)) as product_id,
  (1 + (rs.rn % 2))::int as quantity,
  (SELECT selling_price FROM product_list WHERE pn = ((rs.rn % 8) + 1)) as unit_price,
  ((SELECT selling_price FROM product_list WHERE pn = ((rs.rn % 8) + 1)) * (1 + (rs.rn % 2)))::numeric(10,2) as total_price,
  (SELECT commission_rate FROM product_list WHERE pn = ((rs.rn % 8) + 1)) as commission_rate,
  ((SELECT selling_price FROM product_list WHERE pn = ((rs.rn % 8) + 1)) * (1 + (rs.rn % 2)) * (SELECT commission_rate FROM product_list WHERE pn = ((rs.rn % 8) + 1)))::numeric(10,2) as commission_amount
FROM recent_sales rs
WHERE rs.rn > 30 AND rs.rn <= 40; -- 10 vendas com produtos

-- 7. Atualizar final_amount das vendas
UPDATE sales 
SET final_amount = GREATEST(
  (SELECT COALESCE(SUM(total_price), total_amount) FROM sale_items WHERE sale_id = sales.id) - discount_amount,
  0
)
WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a';