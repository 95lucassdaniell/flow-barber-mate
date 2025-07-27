-- FASE 3: Finalizar comandos criando vendas
-- Atualizar comandos para status 'closed' e criar vendas correspondentes

-- Primeiro, atualizar todos os comandos criados para fechados
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
AND status = 'open';

-- Inserir vendas correspondentes aos comandos fechados
INSERT INTO public.sales (
  barbershop_id, command_id, client_id, barber_id, 
  total_amount, discount_amount, final_amount,
  payment_method, payment_status, sale_date,
  created_at, updated_at
)
SELECT 
  c.barbershop_id,
  c.id as command_id,
  c.client_id,
  c.barber_id,
  c.total_amount,
  0 as discount_amount, -- Sem desconto para simplificar
  c.total_amount as final_amount,
  c.payment_method,
  'paid' as payment_status,
  a.appointment_date as sale_date,
  c.closed_at as created_at,
  c.closed_at as updated_at
FROM public.commands c
JOIN public.appointments a ON c.appointment_id = a.id
WHERE c.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
AND c.status = 'closed'
AND c.payment_status = 'paid';

-- Verificar resultados
SELECT 
  (SELECT COUNT(*) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_sales,
  (SELECT SUM(final_amount) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_revenue,
  (SELECT COUNT(*) FROM public.commands WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'closed') as commands_closed;