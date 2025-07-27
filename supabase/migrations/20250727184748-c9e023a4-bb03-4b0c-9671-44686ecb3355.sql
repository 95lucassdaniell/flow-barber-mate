-- Primeiro, corrigir as vendas que têm final_amount = 0 
-- Relacionando com comandas através de dados comuns
UPDATE public.sales 
SET 
  total_amount = c.total_amount,
  final_amount = c.total_amount
FROM public.commands c
WHERE sales.barbershop_id = c.barbershop_id
  AND sales.client_id = c.client_id
  AND sales.barber_id = c.barber_id
  AND sales.sale_date = c.closed_at::date
  AND c.status = 'closed'
  AND sales.final_amount = 0;

-- Gerar sale_items baseados nos command_items
-- Usando a relação através dos dados comuns
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
SELECT DISTINCT
  s.id as sale_id,
  ci.item_type,
  ci.service_id,
  ci.product_id,
  ci.quantity,
  ci.unit_price,
  ci.total_price,
  COALESCE(p.commission_rate, 15) as commission_rate,
  ci.total_price * (COALESCE(p.commission_rate, 15) / 100) as commission_amount
FROM public.sales s
INNER JOIN public.commands c ON (
  s.barbershop_id = c.barbershop_id
  AND s.client_id = c.client_id
  AND s.barber_id = c.barber_id
  AND s.sale_date = c.closed_at::date
)
INNER JOIN public.command_items ci ON c.id = ci.command_id
LEFT JOIN public.profiles p ON s.barber_id = p.id
WHERE c.status = 'closed'
  AND NOT EXISTS (
    SELECT 1 FROM public.sale_items si WHERE si.sale_id = s.id
  );

-- Gerar comissões baseadas nos sale_items criados
INSERT INTO public.commissions (
  barbershop_id,
  barber_id,
  sale_id,
  sale_item_id,
  commission_type,
  base_amount,
  commission_rate,
  commission_amount,
  commission_date,
  status
)
SELECT 
  s.barbershop_id,
  s.barber_id,
  si.sale_id,
  si.id as sale_item_id,
  si.item_type as commission_type,
  si.total_price as base_amount,
  si.commission_rate,
  si.commission_amount,
  s.sale_date as commission_date,
  'paid' as status
FROM public.sale_items si
INNER JOIN public.sales s ON si.sale_id = s.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.commissions co WHERE co.sale_item_id = si.id
)
AND si.commission_amount > 0;