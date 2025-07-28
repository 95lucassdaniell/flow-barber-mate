-- Corrigir a senha do usuário joaosilva@gmail.com na tabela auth.users
UPDATE auth.users 
SET 
  encrypted_password = crypt('FHMMABhJ', gen_salt('bf')),
  updated_at = now()
WHERE email = 'joaosilva@gmail.com';

-- Melhorar a função set_temporary_password para sempre sincronizar auth.users
CREATE OR REPLACE FUNCTION public.set_temporary_password(provider_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  temp_password TEXT;
  provider_record RECORD;
  user_exists BOOLEAN;
BEGIN
  -- Verificar se o usuário atual é admin da barbearia do prestador
  SELECT p.*, b.id as barbershop_id
  INTO provider_record
  FROM public.profiles p
  JOIN public.barbershops b ON p.barbershop_id = b.id
  WHERE p.id = provider_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider not found';
  END IF;
  
  IF provider_record.barbershop_id != get_user_barbershop_id() OR NOT is_user_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Gerar senha temporária
  temp_password := generate_temporary_password();
  
  -- Verificar se já existe usuário no auth.users com este email
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = provider_record.email
  ) INTO user_exists;
  
  -- Se não existe usuário no auth.users, criar um
  IF NOT user_exists THEN
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
      provider_record.user_id,
      'authenticated',
      'authenticated',
      provider_record.email,
      crypt(temp_password, gen_salt('bf')),
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
  ELSE
    -- Se já existe, sempre atualizar a senha para sincronizar
    UPDATE auth.users 
    SET 
      encrypted_password = crypt(temp_password, gen_salt('bf')),
      updated_at = now()
    WHERE id = provider_record.user_id;
  END IF;
  
  -- Atualizar o prestador com a senha temporária
  UPDATE public.profiles
  SET 
    temporary_password = temp_password,
    password_expires_at = now() + INTERVAL '30 days',
    must_change_password = true
  WHERE id = provider_id;
  
  RETURN temp_password;
END;
$function$;