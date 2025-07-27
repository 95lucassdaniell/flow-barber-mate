-- FASE 8: Corrigir todos os comandos e vendas

-- Primeiro, fechar TODOS os comandos de agendamentos completados
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

-- Agora criar vendas para TODOS os comandos fechados que não têm vendas
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
  'Venda automática do agendamento' as notes,
  c.barber_id as created_by,
  c.closed_at as created_at,
  c.closed_at as updated_at
FROM public.commands c
JOIN public.appointments a ON c.appointment_id = a.id
WHERE c.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
AND c.status = 'closed'
AND c.payment_status = 'paid'
AND c.id NOT IN (
  -- Excluir comandos que já têm vendas baseadas no ID da comanda (se existir relação)
  -- Como não temos relação direta, vamos usar uma lógica diferente
  SELECT DISTINCT c2.id 
  FROM public.commands c2
  JOIN public.sales s ON (
    s.barbershop_id = c2.barbershop_id 
    AND s.client_id = c2.client_id 
    AND s.barber_id = c2.barber_id
    AND s.total_amount = c2.total_amount
  )
  WHERE c2.barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'
);

-- Verificar totais finais
SELECT 
  (SELECT COUNT(*) FROM public.clients WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_clients,
  (SELECT COUNT(*) FROM public.appointments WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_appointments,
  (SELECT COUNT(*) FROM public.commands WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_commands,
  (SELECT COUNT(*) FROM public.commands WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a' AND status = 'closed') as commands_closed,
  (SELECT COUNT(*) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_sales,
  (SELECT COALESCE(SUM(final_amount), 0) FROM public.sales WHERE barbershop_id = '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a') as total_revenue;