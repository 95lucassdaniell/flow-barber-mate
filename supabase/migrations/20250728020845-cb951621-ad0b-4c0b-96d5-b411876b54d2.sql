-- Primeiro, criar usuários no auth.users para todos os providers que não existem
-- com a senha padrão "vargas321"
DO $$
DECLARE
    provider_record RECORD;
    user_exists BOOLEAN;
BEGIN
    FOR provider_record IN 
        SELECT id, user_id, email, full_name 
        FROM public.profiles 
        WHERE role = 'barber' AND is_active = true
    LOOP
        -- Verificar se já existe usuário no auth.users
        SELECT EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = provider_record.user_id
        ) INTO user_exists;
        
        -- Se não existe, criar com senha padrão
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
                crypt('vargas321', gen_salt('bf')),
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
            -- Se já existe, atualizar para senha padrão
            UPDATE auth.users 
            SET 
                encrypted_password = crypt('vargas321', gen_salt('bf')),
                updated_at = now()
            WHERE id = provider_record.user_id;
        END IF;
    END LOOP;
END $$;

-- Remover campos desnecessários da tabela profiles
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS temporary_password,
DROP COLUMN IF EXISTS password_expires_at,
DROP COLUMN IF EXISTS must_change_password;

-- Criar nova função para definir senha de provider (não temporária)
CREATE OR REPLACE FUNCTION public.set_provider_password(provider_id uuid, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
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
    
    -- Verificar se já existe usuário no auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = provider_record.user_id
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
            crypt(new_password, gen_salt('bf')),
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
        -- Se já existe, atualizar a senha
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(new_password, gen_salt('bf')),
            updated_at = now()
        WHERE id = provider_record.user_id;
    END IF;
    
    RETURN true;
END;
$function$;

-- Remover a função antiga
DROP FUNCTION IF EXISTS public.set_temporary_password(uuid);

-- Atualizar função generate_temporary_password para generate_provider_password
CREATE OR REPLACE FUNCTION public.generate_provider_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$function$;