-- Criar dados fictícios para testar IA Preditiva
-- Barbearia Vargas ID: 3fa85f64-5717-4562-b3fc-2c963f66afa6

-- 1. Criar Barbeiros/Prestadores (8 perfis)
INSERT INTO public.profiles (id, user_id, full_name, email, phone, role, barbershop_id, commission_rate, is_active) VALUES
(gen_random_uuid(), gen_random_uuid(), 'Carlos Silva', 'carlos@barbeariavargas.com', '11987654321', 'barber', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 0.40, true),
(gen_random_uuid(), gen_random_uuid(), 'Roberto Santos', 'roberto@barbeariavargas.com', '11987654322', 'barber', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 0.35, true),
(gen_random_uuid(), gen_random_uuid(), 'Diego Oliveira', 'diego@barbeariavargas.com', '11987654323', 'barber', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 0.45, true),
(gen_random_uuid(), gen_random_uuid(), 'Rafael Costa', 'rafael@barbeariavargas.com', '11987654324', 'barber', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 0.38, true),
(gen_random_uuid(), gen_random_uuid(), 'André Lima', 'andre@barbeariavargas.com', '11987654325', 'barber', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 0.42, true),
(gen_random_uuid(), gen_random_uuid(), 'Fernando Souza', 'fernando@barbeariavargas.com', '11987654326', 'barber', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 0.36, true),
(gen_random_uuid(), gen_random_uuid(), 'Thiago Pereira', 'thiago@barbeariavargas.com', '11987654327', 'barber', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 0.41, true),
(gen_random_uuid(), gen_random_uuid(), 'Marcelo Ferreira', 'marcelo@barbeariavargas.com', '11987654328', 'barber', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 0.39, true);

-- 2. Expandir Serviços (15 serviços completos)
INSERT INTO public.services (id, name, description, duration_minutes, barbershop_id, is_active) VALUES
(gen_random_uuid(), 'Corte Simples', 'Corte tradicional masculino', 30, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Corte + Barba', 'Corte completo com acabamento de barba', 45, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Barba Completa', 'Aparar e modelar barba', 25, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Corte Premium', 'Corte diferenciado com acabamento especial', 50, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Lavagem + Corte', 'Lavagem com produtos especiais e corte', 40, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Sobrancelha Masculina', 'Design e aparar sobrancelhas', 15, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Relaxamento', 'Tratamento capilar relaxante', 60, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Corte Infantil', 'Corte especializado para crianças', 25, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Degradê', 'Corte degradê moderno', 35, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Platinado', 'Descoloração completa', 120, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Corte Social', 'Corte executivo profissional', 35, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Hidratação', 'Tratamento hidratante capilar', 45, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Barba Vintage', 'Barba estilo vintage com cera', 35, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Corte + Lavagem + Barba', 'Pacote completo premium', 60, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Retoque', 'Retoque rápido de corte', 15, '3fa85f64-5717-4562-b3fc-2c963f66afa6', true);

-- 3. Criar Produtos (25 produtos)
INSERT INTO public.products (id, name, description, category, cost_price, selling_price, stock_quantity, min_stock_alert, commission_rate, commission_type, barbershop_id, is_active) VALUES
(gen_random_uuid(), 'Shampoo Anticaspa', 'Shampoo profissional anticaspa 500ml', 'higiene', 15.50, 28.90, 45, 10, 0.20, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Condicionador Hidratante', 'Condicionador para cabelos secos 500ml', 'higiene', 18.00, 32.90, 38, 8, 0.20, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Pomada Modeladora', 'Pomada para modelar cabelo 100g', 'styling', 22.50, 45.90, 25, 5, 0.25, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Cera para Bigode', 'Cera especial para bigode 30g', 'styling', 12.00, 24.90, 15, 3, 0.25, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Óleo para Barba', 'Óleo hidratante para barba 50ml', 'barba', 25.00, 49.90, 32, 8, 0.30, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Loção Pós-Barba', 'Loção calmante pós-barba 100ml', 'barba', 20.00, 38.90, 28, 6, 0.25, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Gel Fixador Forte', 'Gel fixador extra forte 250ml', 'styling', 16.50, 31.90, 42, 10, 0.20, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Spray Texturizador', 'Spray para texturizar cabelo 200ml', 'styling', 28.00, 54.90, 18, 5, 0.28, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Shampoo Matizador', 'Shampoo matizador para loiros 300ml', 'higiene', 32.00, 62.90, 22, 5, 0.25, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Máscara Capilar', 'Máscara reconstrutora 300g', 'tratamento', 35.00, 68.90, 16, 4, 0.30, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Tônico Capilar', 'Tônico anticaspa e oleosidade 200ml', 'tratamento', 24.00, 46.90, 26, 6, 0.25, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Clay Modelador', 'Clay matte para modelar 80g', 'styling', 30.00, 58.90, 12, 3, 0.30, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Bálsamo para Barba', 'Bálsamo hidratante para barba 60g', 'barba', 27.00, 52.90, 19, 5, 0.28, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Descolorante em Pó', 'Descolorante profissional 500g', 'coloracao', 18.50, 35.90, 35, 8, 0.22, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Oxidante 20vol', 'Oxidante cremoso 20 volumes 900ml', 'coloracao', 14.00, 26.90, 48, 12, 0.20, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Tinta Castanho Escuro', 'Tinta profissional castanho escuro', 'coloracao', 22.00, 42.90, 24, 6, 0.25, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Spray Finalizador', 'Spray fixador final 300ml', 'styling', 19.50, 37.90, 31, 8, 0.23, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Sabonete Líquido', 'Sabonete líquido neutro 500ml', 'higiene', 12.50, 23.90, 52, 15, 0.18, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Pente Profissional', 'Pente antiestático profissional', 'ferramentas', 8.50, 16.90, 65, 20, 0.15, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Escova Modeladora', 'Escova redonda para modelar', 'ferramentas', 25.00, 48.90, 18, 5, 0.25, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Toalha Premium', 'Toalha de algodão premium', 'acessorios', 15.00, 29.90, 45, 12, 0.20, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Kit Barba Completo', 'Kit com óleo, bálsamo e pente', 'kit', 65.00, 129.90, 8, 2, 0.35, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Ampola Reconstrutora', 'Ampola de tratamento intensivo', 'tratamento', 8.50, 16.90, 75, 20, 0.20, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Mousse Volumizador', 'Mousse para dar volume 200ml', 'styling', 21.00, 39.90, 29, 7, 0.24, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true),
(gen_random_uuid(), 'Protetor Térmico', 'Protetor térmico para cabelo 150ml', 'tratamento', 26.50, 51.90, 23, 6, 0.28, 'percentage', '3fa85f64-5717-4562-b3fc-2c963f66afa6', true);

-- 4. Criar Clientes (80 clientes)
INSERT INTO public.clients (id, name, phone, email, birth_date, notes, barbershop_id) VALUES
(gen_random_uuid(), 'João Silva', '11999888777', 'joao.silva@email.com', '1985-03-15', 'Cliente fiel, prefere cortes clássicos', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Pedro Santos', '11999888778', 'pedro.santos@email.com', '1990-07-22', 'Gosta de degradê moderno', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Lucas Oliveira', '11999888779', 'lucas.oliveira@email.com', '1988-11-08', 'Cliente VIP, sempre agenda com Carlos', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Rafael Costa', '11999888780', 'rafael.costa@email.com', '1992-05-14', 'Faz barba toda semana', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'André Lima', '11999888781', 'andre.lima@email.com', '1987-09-30', 'Prefere horários matutinos', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Fernando Souza', '11999888782', 'fernando.souza@email.com', '1984-12-03', 'Cliente executivo', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Thiago Pereira', '11999888783', 'thiago.pereira@email.com', '1991-04-18', 'Gosta de produtos premium', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Marcelo Ferreira', '11999888784', 'marcelo.ferreira@email.com', '1989-08-25', 'Cliente desde 2020', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Gabriel Alves', '11999888785', 'gabriel.alves@email.com', '1993-01-12', 'Faz relaxamento mensalmente', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Bruno Dias', '11999888786', 'bruno.dias@email.com', '1986-06-27', 'Prefere Roberto como barbeiro', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Daniel Rocha', '11999888787', 'daniel.rocha@email.com', '1990-10-09', 'Cliente pontual', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Rodrigo Martins', '11999888788', 'rodrigo.martins@email.com', '1988-02-16', 'Gosta de experimentar novos cortes', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Felipe Nascimento', '11999888789', 'felipe.nascimento@email.com', '1992-07-04', 'Cliente jovem, moderno', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Gustavo Ribeiro', '11999888790', 'gustavo.ribeiro@email.com', '1985-11-21', 'Empresário, agenda com antecedência', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Henrique Cardoso', '11999888791', 'henrique.cardoso@email.com', '1991-03-08', 'Faz platinado ocasionalmente', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Igor Barbosa', '11999888792', 'igor.barbosa@email.com', '1989-08-13', 'Cliente fiel ao Diego', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Julio César', '11999888793', 'julio.cesar@email.com', '1987-05-29', 'Gosta de barba vintage', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Leonardo Gomes', '11999888794', 'leonardo.gomes@email.com', '1994-12-17', 'Estudante universitário', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Mateus Ramos', '11999888795', 'mateus.ramos@email.com', '1986-04-23', 'Professor, agenda aos sábados', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Nicolas Teixeira', '11999888796', 'nicolas.teixeira@email.com', '1990-09-11', 'Cliente premium', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Otávio Miranda', '11999888797', 'otavio.miranda@email.com', '1983-01-25', 'Cliente há 5 anos', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Paulo Henrique', '11999888798', 'paulo.henrique@email.com', '1992-06-19', 'Advogado, muito pontual', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Renato Silva', '11999888799', 'renato.silva@email.com', '1988-10-07', 'Gosta de hidratação', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Samuel Costa', '11999888800', 'samuel.costa@email.com', '1985-12-31', 'Cliente tradicional', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Vinícius Oliveira', '11999888801', 'vinicius.oliveira@email.com', '1991-07-14', 'Influencer digital', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Wagner Pereira', '11999888802', 'wagner.pereira@email.com', '1989-03-28', 'Médico, agenda com antecedência', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Alexandre Santos', '11999888803', 'alexandre.santos@email.com', '1987-08-16', 'Cliente executivo senior', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Carlos Eduardo', '11999888804', 'carlos.eduardo@email.com', '1993-11-02', 'Engenheiro civil', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Diego Fernandes', '11999888805', 'diego.fernandes@email.com', '1986-05-20', 'Dono de empresa', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Eduardo Martins', '11999888806', 'eduardo.martins@email.com', '1990-09-08', 'Contador público', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Fábio Lima', '11999888807', 'fabio.lima@email.com', '1984-02-14', 'Aposentado ativo', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Guilherme Rosa', '11999888808', 'guilherme.rosa@email.com', '1992-12-06', 'Designer gráfico', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Hugo Almeida', '11999888809', 'hugo.almeida@email.com', '1988-07-24', 'Arquiteto criativo', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Ivan Souza', '11999888810', 'ivan.souza@email.com', '1991-04-11', 'Programador freelancer', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Jair Rodrigues', '11999888811', 'jair.rodrigues@email.com', '1985-10-28', 'Vendedor experiente', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Kleber Santos', '11999888812', 'kleber.santos@email.com', '1989-06-15', 'Mecânico automotivo', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Luciano Dias', '11999888813', 'luciano.dias@email.com', '1987-01-03', 'Músico profissional', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Márcio Ferreira', '11999888814', 'marcio.ferreira@email.com', '1994-08-21', 'Personal trainer', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Nelson Oliveira', '11999888815', 'nelson.oliveira@email.com', '1983-03-17', 'Jornalista veterano', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Oscar Lima', '11999888816', 'oscar.lima@email.com', '1990-11-09', 'Chef de cozinha', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Patrick Silva', '11999888817', 'patrick.silva@email.com', '1992-05-27', 'Publicitário criativo', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Quintino Costa', '11999888818', 'quintino.costa@email.com', '1986-12-13', 'Administrador público', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Ricardo Pereira', '11999888819', 'ricardo.pereira@email.com', '1988-09-01', 'Dentista conceituado', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Sérgio Martins', '11999888820', 'sergio.martins@email.com', '1991-02-18', 'Fisioterapeuta', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Tiago Nascimento', '11999888821', 'tiago.nascimento@email.com', '1985-07-05', 'Policial militar', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Ulisses Rocha', '11999888822', 'ulisses.rocha@email.com', '1993-04-22', 'Veterinário', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Valdir Santos', '11999888823', 'valdir.santos@email.com', '1987-11-08', 'Farmacêutico', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Wesley Oliveira', '11999888824', 'wesley.oliveira@email.com', '1990-06-26', 'Psicólogo clínico', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Xavier Lima', '11999888825', 'xavier.lima@email.com', '1989-01-14', 'Corretor de imóveis', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Yago Costa', '11999888826', 'yago.costa@email.com', '1992-08-31', 'Nutricionista', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Zé Carlos', '11999888827', 'ze.carlos@email.com', '1984-05-10', 'Motorista profissional', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Antonio Silva', '11999888828', 'antonio.silva@email.com', '1981-09-23', 'Aposentado do banco', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Benedito Santos', '11999888829', 'benedito.santos@email.com', '1979-02-07', 'Ex-militar', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Cláudio Oliveira', '11999888830', 'claudio.oliveira@email.com', '1986-12-19', 'Comerciante', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Domingos Lima', '11999888831', 'domingos.lima@email.com', '1983-07-02', 'Funcionário público', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Edmundo Costa', '11999888832', 'edmundo.costa@email.com', '1988-03-15', 'Engenheiro elétrico', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Francisco Pereira', '11999888833', 'francisco.pereira@email.com', '1991-10-28', 'Técnico informática', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Geraldo Martins', '11999888834', 'geraldo.martins@email.com', '1985-06-14', 'Supervisor industrial', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Hélio Nascimento', '11999888835', 'helio.nascimento@email.com', '1989-01-26', 'Bancário senior', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Ismael Rocha', '11999888836', 'ismael.rocha@email.com', '1992-11-12', 'Analista sistemas', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Jorge Santos', '11999888837', 'jorge.santos@email.com', '1987-08-04', 'Gerente comercial', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Lauro Oliveira', '11999888838', 'lauro.oliveira@email.com', '1990-04-17', 'Coordenador RH', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Mário Lima', '11999888839', 'mario.lima@email.com', '1984-12-30', 'Diretor financeiro', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Norberto Costa', '11999888840', 'norberto.costa@email.com', '1986-09-16', 'Analista contábil', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Orlando Pereira', '11999888841', 'orlando.pereira@email.com', '1993-05-03', 'Desenvolvedor web', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Paulo Roberto', '11999888842', 'paulo.roberto@email.com', '1988-02-20', 'Consultor técnico', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Quirino Martins', '11999888843', 'quirino.martins@email.com', '1991-07-08', 'Auditor interno', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Ronaldo Nascimento', '11999888844', 'ronaldo.nascimento@email.com', '1985-11-25', 'Supervisor vendas', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Sebastião Rocha', '11999888845', 'sebastiao.rocha@email.com', '1989-06-11', 'Técnico eletrônica', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Teodoro Santos', '11999888846', 'teodoro.santos@email.com', '1992-03-29', 'Analista qualidade', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Ubiratan Oliveira', '11999888847', 'ubiratan.oliveira@email.com', '1987-12-15', 'Gerente produção', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Valter Lima', '11999888848', 'valter.lima@email.com', '1990-09-02', 'Coordenador logística', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Washington Costa', '11999888849', 'washington.costa@email.com', '1984-04-18', 'Supervisor manutenção', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Ximenes Pereira', '11999888850', 'ximenes.pereira@email.com', '1986-01-05', 'Analista financeiro', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Yuri Martins', '11999888851', 'yuri.martins@email.com', '1993-08-22', 'Consultor negócios', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Zacarias Nascimento', '11999888852', 'zacarias.nascimento@email.com', '1988-05-09', 'Especialista TI', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Adolfo Rocha', '11999888853', 'adolfo.rocha@email.com', '1991-10-14', 'Advogado corporativo', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Bento Santos', '11999888854', 'bento.santos@email.com', '1985-07-01', 'Engenheiro mecânico', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Célio Oliveira', '11999888855', 'celio.oliveira@email.com', '1989-03-18', 'Coordenador projetos', '3fa85f64-5717-4562-b3fc-2c963f66afa6'),
(gen_random_uuid(), 'Dalton Lima', '11999888856', 'dalton.lima@email.com', '1992-12-05', 'Analista marketing', '3fa85f64-5717-4562-b3fc-2c963f66afa6');

-- 5. Criar relações provider_services para barbeiros com preços específicos
INSERT INTO public.provider_services (provider_id, service_id, price)
SELECT 
    p.id as provider_id,
    s.id as service_id,
    CASE s.name
        WHEN 'Corte Simples' THEN 35.00
        WHEN 'Corte + Barba' THEN 55.00
        WHEN 'Barba Completa' THEN 25.00
        WHEN 'Corte Premium' THEN 65.00
        WHEN 'Lavagem + Corte' THEN 45.00
        WHEN 'Sobrancelha Masculina' THEN 15.00
        WHEN 'Relaxamento' THEN 85.00
        WHEN 'Corte Infantil' THEN 25.00
        WHEN 'Degradê' THEN 40.00
        WHEN 'Platinado' THEN 150.00
        WHEN 'Corte Social' THEN 40.00
        WHEN 'Hidratação' THEN 60.00
        WHEN 'Barba Vintage' THEN 35.00
        WHEN 'Corte + Lavagem + Barba' THEN 80.00
        WHEN 'Retoque' THEN 20.00
        ELSE 35.00
    END as price
FROM profiles p
CROSS JOIN services s
WHERE p.role = 'barber' 
  AND p.barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
  AND s.barbershop_id = '3fa85f64-5717-4562-b3fc-2c963f66afa6';