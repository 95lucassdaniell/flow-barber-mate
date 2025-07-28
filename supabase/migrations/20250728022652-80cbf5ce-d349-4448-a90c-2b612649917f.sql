-- Política para permitir verificação de providers por email durante login
CREATE POLICY "Allow provider email verification for login" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (role = 'barber' AND is_active = true);