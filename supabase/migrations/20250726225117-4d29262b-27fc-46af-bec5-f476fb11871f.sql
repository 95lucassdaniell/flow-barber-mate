-- Atualizar a senha do super admin lucas@letgrupo.com.br
UPDATE auth.users 
SET 
  encrypted_password = crypt('lucaslol321', gen_salt('bf')),
  updated_at = now()
WHERE email = 'lucas@letgrupo.com.br';