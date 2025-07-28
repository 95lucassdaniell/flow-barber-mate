-- Remover a foreign key constraint se existir e criar usuário para prestador
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Agora criar o usuário para João Silva
DO $$
DECLARE
  provider_record RECORD;
  new_user_id UUID;
BEGIN
  -- Buscar o prestador
  SELECT * INTO provider_record 
  FROM profiles 
  WHERE email = 'joaosilva@gmail.com' AND role = 'barber';
  
  IF provider_record.id IS NOT NULL THEN
    -- Gerar novo UUID para user_id
    new_user_id := gen_random_uuid();
    
    -- Inserir no auth.users primeiro
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      provider_record.email,
      crypt(provider_record.temporary_password, gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      format('{"full_name": "%s", "email": "%s"}', provider_record.full_name, provider_record.email)::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    -- Depois atualizar o profile com o user_id
    UPDATE profiles 
    SET user_id = new_user_id 
    WHERE id = provider_record.id;
  END IF;
END $$;