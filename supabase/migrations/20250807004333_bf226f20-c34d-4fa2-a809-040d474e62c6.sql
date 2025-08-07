-- Criar perfil para usuário sem profile
INSERT INTO profiles (user_id, barbershop_id, role, full_name, email)
SELECT 
  'f1f067ec-8977-47b5-b64e-8124085a7c55',
  (SELECT id FROM barbershops WHERE slug = 'test-barbershop' LIMIT 1),
  'admin',
  'Lucas Daniel',
  'lucasdanielflix@gmail.com'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE user_id = 'f1f067ec-8977-47b5-b64e-8124085a7c55'
);

-- Se não existe barbershop teste, criar uma
INSERT INTO barbershops (name, slug, status, created_by)
SELECT 
  'Test Barbershop',
  'test-barbershop', 
  'active',
  'f1f067ec-8977-47b5-b64e-8124085a7c55'
WHERE NOT EXISTS (
  SELECT 1 FROM barbershops WHERE slug = 'test-barbershop'
);