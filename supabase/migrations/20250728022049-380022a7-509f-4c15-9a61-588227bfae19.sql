-- Criar usuário no auth.users para João Silva
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
    'f5c2a0ba-2da6-4249-98c7-73c5e0c41f6f',
    'authenticated',
    'authenticated',
    'joaosilva@gmail.com',
    crypt('vargas321', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "João Silva", "email": "joaosilva@gmail.com"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('vargas321', gen_salt('bf')),
    updated_at = now();