-- Criar dados básicos fictícios para testar IA Preditiva
-- Inserindo dados mínimos funcionais

-- 1. Inserir alguns serviços básicos
INSERT INTO public.services (name, description, duration_minutes, barbershop_id, is_active) VALUES
('Corte Masculino', 'Corte tradicional masculino', 30, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
('Corte + Barba', 'Corte completo com barba', 45, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
('Barba', 'Aparar e modelar barba', 25, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
('Degradê', 'Corte degradê moderno', 35, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
('Platinado', 'Descoloração completa', 120, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true);

-- 2. Inserir alguns produtos
INSERT INTO public.products (name, description, category, cost_price, selling_price, stock_quantity, commission_rate, barbershop_id, is_active) VALUES
('Pomada Modeladora', 'Pomada para modelar cabelo', 'styling', 20.00, 45.00, 25, 0.25, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
('Shampoo Anticaspa', 'Shampoo profissional', 'higiene', 15.00, 30.00, 40, 0.20, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
('Óleo para Barba', 'Óleo hidratante para barba', 'barba', 25.00, 50.00, 30, 0.30, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
('Gel Fixador', 'Gel fixador forte', 'styling', 16.00, 32.00, 35, 0.20, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true);

-- 3. Inserir alguns clientes
INSERT INTO public.clients (name, phone, email, birth_date, notes, barbershop_id) VALUES
('João Silva', '11999888777', 'joao@email.com', '1985-03-15', 'Cliente fiel', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
('Pedro Santos', '11999888778', 'pedro@email.com', '1990-07-22', 'Gosta de degradê', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
('Lucas Oliveira', '11999888779', 'lucas@email.com', '1988-11-08', 'Cliente VIP', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
('Rafael Costa', '11999888780', 'rafael@email.com', '1992-05-14', 'Faz barba toda semana', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
('André Lima', '11999888781', 'andre@email.com', '1987-09-30', 'Horários matutinos', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
('Bruno Dias', '11999888782', 'bruno@email.com', '1986-06-27', 'Cliente desde 2020', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
('Daniel Rocha', '11999888783', 'daniel@email.com', '1990-10-09', 'Cliente pontual', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
('Felipe Santos', '11999888784', 'felipe@email.com', '1992-07-04', 'Cliente jovem', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
('Gustavo Silva', '11999888785', 'gustavo@email.com', '1985-11-21', 'Empresário', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
('Henrique Costa', '11999888786', 'henrique@email.com', '1991-03-08', 'Gosta de platinado', '3fa85f64-5717-4562-b3fc-2c963f66afa6');

-- 4. Verificar se temos barbeiros (profiles com role = 'barber')
-- Se não tiver, vamos usar o admin existente para criar alguns agendamentos fictícios

-- 5. Criar alguns agendamentos históricos usando o admin existente como "barbeiro"
WITH admin_profile AS (
  SELECT id FROM profiles WHERE role = 'admin' AND barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' LIMIT 1
),
service_list AS (
  SELECT id, name FROM services WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' LIMIT 5
),
client_list AS (
  SELECT id, name FROM clients WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' LIMIT 10
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
  c.id as client_id,
  ap.id as barber_id,
  s.id as service_id,
  (CURRENT_DATE - (row_number() OVER () % 90)::int) as appointment_date,
  ('09:00'::time + ((row_number() OVER () % 8) * interval '1 hour')) as start_time,
  ('09:00'::time + ((row_number() OVER () % 8) * interval '1 hour') + interval '30 minutes') as end_time,
  CASE s.name
    WHEN 'Corte Masculino' THEN 35.00
    WHEN 'Corte + Barba' THEN 55.00
    WHEN 'Barba' THEN 25.00
    WHEN 'Degradê' THEN 40.00
    WHEN 'Platinado' THEN 150.00
    ELSE 35.00
  END as total_price,
  CASE 
    WHEN (row_number() OVER () % 10) = 0 THEN 'cancelled'
    WHEN (row_number() OVER () % 15) = 0 THEN 'no_show'
    ELSE 'completed'
  END as status,
  '3fa85f64-5717-4562-b3fc-2c963f66afa6'::uuid as barbershop_id,
  CASE 
    WHEN (row_number() OVER () % 5) = 0 THEN 'Cliente satisfeito'
    ELSE NULL
  END as notes
FROM admin_profile ap
CROSS JOIN client_list c
CROSS JOIN service_list s
WHERE (row_number() OVER ()) <= 50; -- Criar 50 agendamentos

-- 6. Criar algumas vendas históricas
WITH admin_profile AS (
  SELECT id FROM profiles WHERE role = 'admin' AND barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' LIMIT 1
),
client_list AS (
  SELECT id, name FROM clients WHERE barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' LIMIT 10
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
  c.id as client_id,
  ap.id as barber_id,
  ap.id as created_by,
  (CURRENT_DATE - (row_number() OVER () % 60)::int) as sale_date,
  ('10:00'::time + ((row_number() OVER () % 8) * interval '1 hour')) as sale_time,
  (50 + (row_number() OVER () % 100))::numeric(10,2) as total_amount,
  CASE WHEN (row_number() OVER () % 10) = 0 THEN 5.00 ELSE 0.00 END as discount_amount,
  (50 + (row_number() OVER () % 100) - CASE WHEN (row_number() OVER () % 10) = 0 THEN 5.00 ELSE 0.00 END)::numeric(10,2) as final_amount,
  (ARRAY['cash', 'card', 'pix'])[((row_number() OVER () % 3) + 1)] as payment_method,
  'paid' as payment_status,
  '3fa85f64-5717-4562-b3fc-2c963f66afa6'::uuid as barbershop_id,
  CASE 
    WHEN (row_number() OVER () % 8) = 0 THEN 'Cliente fiel'
    ELSE NULL
  END as notes
FROM admin_profile ap
CROSS JOIN client_list c
WHERE (row_number() OVER ()) <= 30; -- Criar 30 vendas