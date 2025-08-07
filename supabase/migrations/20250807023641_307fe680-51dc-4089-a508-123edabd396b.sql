-- Verificar e corrigir políticas RLS para whatsapp_conversations
-- Criar política que permite usuários acessarem conversas do seu barbershop

-- Primeiro, criar função para verificar se usuário pertence ao barbershop
CREATE OR REPLACE FUNCTION public.user_belongs_to_barbershop(barbershop_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND barbershop_id = barbershop_uuid
  );
END;
$$;

-- Atualizar políticas RLS para whatsapp_conversations para permitir acesso baseado no barbershop
DROP POLICY IF EXISTS "Users can view whatsapp conversations from their barbershop" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Admins can manage whatsapp conversations" ON public.whatsapp_conversations;

CREATE POLICY "Users can view whatsapp conversations from their barbershop" 
ON public.whatsapp_conversations 
FOR SELECT 
USING (public.user_belongs_to_barbershop(barbershop_id));

CREATE POLICY "Admins can manage whatsapp conversations" 
ON public.whatsapp_conversations 
FOR ALL 
USING (public.user_belongs_to_barbershop(barbershop_id) AND public.is_user_admin());

-- Atualizar políticas RLS para whatsapp_messages para permitir acesso baseado no barbershop
DROP POLICY IF EXISTS "Users can view whatsapp messages from their barbershop" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Admins can manage whatsapp messages" ON public.whatsapp_messages;

CREATE POLICY "Users can view whatsapp messages from their barbershop" 
ON public.whatsapp_messages 
FOR SELECT 
USING (public.user_belongs_to_barbershop(barbershop_id));

CREATE POLICY "Admins can manage whatsapp messages" 
ON public.whatsapp_messages 
FOR ALL 
USING (public.user_belongs_to_barbershop(barbershop_id) AND public.is_user_admin());

-- Atualizar políticas para whatsapp_instances
DROP POLICY IF EXISTS "Users can view whatsapp instances from their barbershop" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Admins can manage whatsapp instances" ON public.whatsapp_instances;

CREATE POLICY "Users can view whatsapp instances from their barbershop" 
ON public.whatsapp_instances 
FOR SELECT 
USING (public.user_belongs_to_barbershop(barbershop_id));

CREATE POLICY "Admins can manage whatsapp instances" 
ON public.whatsapp_instances 
FOR ALL 
USING (public.user_belongs_to_barbershop(barbershop_id) AND public.is_user_admin());

-- Atualizar políticas para whatsapp_conversation_tags
DROP POLICY IF EXISTS "Users can view conversation tags from their barbershop" ON public.whatsapp_conversation_tags;
DROP POLICY IF EXISTS "Admins can manage conversation tags" ON public.whatsapp_conversation_tags;

CREATE POLICY "Users can view conversation tags from their barbershop" 
ON public.whatsapp_conversation_tags 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.whatsapp_conversations wc 
  WHERE wc.id = whatsapp_conversation_tags.conversation_id 
  AND public.user_belongs_to_barbershop(wc.barbershop_id)
));

CREATE POLICY "Admins can manage conversation tags" 
ON public.whatsapp_conversation_tags 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.whatsapp_conversations wc 
  WHERE wc.id = whatsapp_conversation_tags.conversation_id 
  AND public.user_belongs_to_barbershop(wc.barbershop_id) 
  AND public.is_user_admin()
));