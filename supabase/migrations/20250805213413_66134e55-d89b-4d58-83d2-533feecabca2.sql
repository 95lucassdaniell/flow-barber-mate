-- Criar foreign key constraint entre provider_subscription_plans e profiles
ALTER TABLE public.provider_subscription_plans 
ADD CONSTRAINT fk_provider_subscription_plans_provider_id 
FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Verificar se existem dados inconsistentes antes de aplicar a constraint
-- Esta query irá falhar se houver provider_ids que não existem na tabela profiles
DO $$
BEGIN
  -- Verificar se todos os provider_ids existem na tabela profiles
  IF EXISTS (
    SELECT 1 
    FROM public.provider_subscription_plans psp
    LEFT JOIN public.profiles p ON psp.provider_id = p.id
    WHERE p.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Existem registros em provider_subscription_plans com provider_id que não existe na tabela profiles. Verifique os dados antes de aplicar a constraint.';
  END IF;
END $$;