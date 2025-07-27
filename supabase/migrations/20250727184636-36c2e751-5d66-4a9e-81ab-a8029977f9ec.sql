-- Gerar sale_items retroativos baseados nos command_items das vendas existentes
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
SELECT 
  s.id as sale_id,
  ci.item_type,
  ci.service_id,
  ci.product_id,
  ci.quantity,
  ci.unit_price,
  ci.total_price,
  ci.commission_rate,
  ci.commission_amount
FROM public.sales s
INNER JOIN public.commands c ON s.command_id = c.id
INNER JOIN public.command_items ci ON c.id = ci.command_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.sale_items si WHERE si.sale_id = s.id
);

-- Gerar comissões retroativas baseadas nos sale_items criados
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