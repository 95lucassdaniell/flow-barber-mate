-- Criar política RLS para permitir inserção de agendamentos por clientes públicos
CREATE POLICY "Public clients can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  -- Verificar se a barbearia existe e está ativa
  EXISTS (SELECT 1 FROM public.barbershops WHERE id = barbershop_id AND status = 'active')
  AND
  -- Verificar se o cliente existe na mesma barbearia
  EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND barbershop_id = appointments.barbershop_id)
  AND
  -- Verificar se o serviço existe e pertence à barbearia
  EXISTS (SELECT 1 FROM public.services WHERE id = service_id AND barbershop_id = appointments.barbershop_id)
  AND
  -- Se barbeiro especificado, verificar se existe e está ativo na barbearia
  (barber_id IS NULL OR EXISTS (SELECT 1 FROM public.profiles WHERE id = barber_id AND barbershop_id = appointments.barbershop_id AND is_active = true))
  AND
  -- Apenas agendamentos com fonte 'online'
  booking_source = 'online'
  AND
  -- Apenas agendamentos futuros
  appointment_date >= CURRENT_DATE
);

-- Criar política RLS para permitir visualização de agendamentos recentes por clientes públicos
CREATE POLICY "Public clients can view their recent appointments" 
ON public.appointments 
FOR SELECT 
USING (
  booking_source = 'online' 
  AND appointment_date >= CURRENT_DATE 
  AND created_at >= NOW() - INTERVAL '1 hour'
);