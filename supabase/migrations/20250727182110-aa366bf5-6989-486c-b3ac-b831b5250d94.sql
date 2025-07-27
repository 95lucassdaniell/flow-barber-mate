-- FASE 7: Corrigir vendas faltantes - criar vendas para todos os comandos fechados

-- Inserir vendas para comandos que ainda não têm vendas correspondentes
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
  0 as discount_amount,
  c.total_amount as final_amount,
  c.payment_method,
  'paid' as payment_status,
  'Venda gerada automaticamente - correção' as notes,
  c.barber_id as created_by,
  c.closed_at as created_at,
  c.closed_at as updated_at
FROM public.commands c
JOIN public.appointments a ON c.appointment_id = a.id
WHERE c.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
AND c.status = 'closed'
AND c.payment_status = 'paid'
AND NOT EXISTS (
  SELECT 1 FROM public.sales s 
  WHERE s.barbershop_id = c.barbershop_id
  AND s.client_id = c.client_id
  AND s.barber_id = c.barber_id
  AND s.sale_date = a.appointment_date
  AND s.total_amount = c.total_amount
);

-- Verificar totais finais corrigidos
SELECT 
  (SELECT COUNT(*) FROM public.clients WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_clients,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_appointments,
  (SELECT COUNT(*) FROM public.commands WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_commands,
  (SELECT COUNT(*) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_sales,
  (SELECT SUM(final_amount) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_revenue,
  -- Estatísticas adicionais
  (SELECT COUNT(*) FROM public.commands WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'closed') as commands_closed,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'completed') as appointments_completed;