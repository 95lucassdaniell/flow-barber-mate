-- Primeiro criar uma barbearia de teste se não existir
DO $$
DECLARE
  test_barbershop_id uuid;
BEGIN
  -- Verificar se já existe uma barbearia de teste
  SELECT id INTO test_barbershop_id 
  FROM barbershops 
  WHERE slug = 'test-barbershop' 
  LIMIT 1;
  
  -- Se não existir, criar uma
  IF test_barbershop_id IS NULL THEN
    INSERT INTO barbershops (name, slug, status, created_by)
    VALUES (
      'Test Barbershop',
      'test-barbershop', 
      'active',
      'f1f067ec-8977-47b5-b64e-8124085a7c55'
    )
    RETURNING id INTO test_barbershop_id;
  END IF;
  
  -- Agora criar o perfil com barbershop_id válido
  INSERT INTO profiles (user_id, barbershop_id, role, full_name, email)
  VALUES (
    'f1f067ec-8977-47b5-b64e-8124085a7c55',
    test_barbershop_id,
    'admin',
    'Lucas Daniel',
    'lucasdanielflix@gmail.com'
  )
  ON CONFLICT (user_id) DO NOTHING;
END $$;