-- Política para permitir consulta de barbearias por slug para usuários anônimos (necessário para login de providers)
CREATE POLICY "Allow barbershop lookup by slug for login" 
ON public.barbershops 
FOR SELECT 
TO anon 
USING (true);