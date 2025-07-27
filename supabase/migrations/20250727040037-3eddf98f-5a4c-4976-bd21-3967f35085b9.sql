-- Criar dados básicos fictícios para testar IA Preditiva
-- Usando o ID correto da barbearia: 9ccfd4a2-3bc1-41be-933b-51e94d0dc29a

-- 1. Inserir alguns serviços básicos
INSERT INTO public.services (name, description, duration_minutes, barbershop_id, is_active) VALUES
('Corte Masculino', 'Corte tradicional masculino', 30, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Corte + Barba', 'Corte completo com barba', 45, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Barba', 'Aparar e modelar barba', 25, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Degradê', 'Corte degradê moderno', 35, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Platinado', 'Descoloração completa', 120, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Lavagem + Corte', 'Lavagem com corte', 40, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Sobrancelha', 'Design de sobrancelha', 15, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Relaxamento', 'Tratamento relaxante', 60, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true);

-- 2. Inserir alguns produtos
INSERT INTO public.products (name, description, category, cost_price, selling_price, stock_quantity, commission_rate, barbershop_id, is_active) VALUES
('Pomada Modeladora', 'Pomada para modelar cabelo', 'styling', 20.00, 45.00, 25, 0.25, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Shampoo Anticaspa', 'Shampoo profissional', 'higiene', 15.00, 30.00, 40, 0.20, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Óleo para Barba', 'Óleo hidratante para barba', 'barba', 25.00, 50.00, 30, 0.30, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Gel Fixador', 'Gel fixador forte', 'styling', 16.00, 32.00, 35, 0.20, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Condicionador', 'Condicionador hidratante', 'higiene', 18.00, 35.00, 30, 0.20, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Cera para Bigode', 'Cera especial para bigode', 'styling', 12.00, 25.00, 15, 0.25, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Loção Pós-Barba', 'Loção calmante', 'barba', 20.00, 40.00, 25, 0.25, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true),
('Máscara Capilar', 'Tratamento intensivo', 'tratamento', 30.00, 60.00, 20, 0.30, '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a', true);

-- 3. Inserir clientes fictícios
INSERT INTO public.clients (name, phone, email, birth_date, notes, barbershop_id) VALUES
('João Silva', '11999888001', 'joao.silva@email.com', '1985-03-15', 'Cliente fiel, prefere cortes clássicos', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Pedro Santos', '11999888002', 'pedro.santos@email.com', '1990-07-22', 'Gosta de degradê moderno', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Lucas Oliveira', '11999888003', 'lucas.oliveira@email.com', '1988-11-08', 'Cliente VIP, sempre agenda antecipado', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Rafael Costa', '11999888004', 'rafael.costa@email.com', '1992-05-14', 'Faz barba toda semana', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('André Lima', '11999888005', 'andre.lima@email.com', '1987-09-30', 'Prefere horários matutinos', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Bruno Dias', '11999888006', 'bruno.dias@email.com', '1986-06-27', 'Cliente desde 2020', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Daniel Rocha', '11999888007', 'daniel.rocha@email.com', '1990-10-09', 'Cliente pontual', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Felipe Santos', '11999888008', 'felipe.santos@email.com', '1992-07-04', 'Cliente jovem, moderno', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Gustavo Silva', '11999888009', 'gustavo.silva@email.com', '1985-11-21', 'Empresário, agenda com antecedência', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Henrique Costa', '11999888010', 'henrique.costa@email.com', '1991-03-08', 'Faz platinado ocasionalmente', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Igor Barbosa', '11999888011', 'igor.barbosa@email.com', '1989-08-13', 'Cliente fiel', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Julio César', '11999888012', 'julio.cesar@email.com', '1987-05-29', 'Gosta de barba vintage', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Leonardo Gomes', '11999888013', 'leonardo.gomes@email.com', '1994-12-17', 'Estudante universitário', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Mateus Ramos', '11999888014', 'mateus.ramos@email.com', '1986-04-23', 'Professor, agenda aos sábados', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Nicolas Teixeira', '11999888015', 'nicolas.teixeira@email.com', '1990-09-11', 'Cliente premium', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Otávio Miranda', '11999888016', 'otavio.miranda@email.com', '1983-01-25', 'Cliente há 5 anos', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Paulo Henrique', '11999888017', 'paulo.henrique@email.com', '1992-06-19', 'Advogado, muito pontual', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Renato Silva', '11999888018', 'renato.silva@email.com', '1988-10-07', 'Gosta de hidratação', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Samuel Costa', '11999888019', 'samuel.costa@email.com', '1985-12-31', 'Cliente tradicional', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a'),
('Vinícius Oliveira', '11999888020', 'vinicius.oliveira@email.com', '1991-07-14', 'Influencer digital', '9ccfd4a2-3bc1-41be-933b-51e94d0dc29a');