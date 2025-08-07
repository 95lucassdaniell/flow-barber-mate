-- Corrigir políticas RLS restantes que podem estar faltando

-- Verificar se a função get_whatsapp_conversations_debug existe, caso não, criar
CREATE OR REPLACE FUNCTION public.get_whatsapp_conversations_debug(p_barbershop_id uuid)
RETURNS TABLE(id uuid, barbershop_id uuid, client_phone text, client_name text, status text, ai_enabled boolean, human_takeover boolean, human_agent_id uuid, last_message_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id,
    wc.barbershop_id,
    wc.client_phone,
    wc.client_name,
    wc.status,
    wc.ai_enabled,
    wc.human_takeover,
    wc.human_agent_id,
    wc.last_message_at,
    wc.created_at,
    wc.updated_at
  FROM public.whatsapp_conversations wc
  WHERE wc.barbershop_id = p_barbershop_id
  ORDER BY wc.last_message_at DESC;
END;
$$;

-- Criar políticas para whatsapp_tags se não existirem
DROP POLICY IF EXISTS "Users can view whatsapp tags from their barbershop" ON public.whatsapp_tags;
DROP POLICY IF EXISTS "Admins can manage whatsapp tags" ON public.whatsapp_tags;

CREATE POLICY "Users can view whatsapp tags from their barbershop" 
ON public.whatsapp_tags 
FOR SELECT 
USING (public.user_belongs_to_barbershop(barbershop_id));

CREATE POLICY "Admins can manage whatsapp tags" 
ON public.whatsapp_tags 
FOR ALL 
USING (public.user_belongs_to_barbershop(barbershop_id) AND public.is_user_admin());

-- Corrigir políticas para permitir inserção de tags e relacionamentos
CREATE POLICY "Users can create conversation tags" 
ON public.whatsapp_conversation_tags 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.whatsapp_conversations wc 
  WHERE wc.id = whatsapp_conversation_tags.conversation_id 
  AND public.user_belongs_to_barbershop(wc.barbershop_id)
));

-- Permitir update nas conversas para takeover/release
CREATE POLICY "Users can update conversation takeover status" 
ON public.whatsapp_conversations 
FOR UPDATE 
USING (public.user_belongs_to_barbershop(barbershop_id))
WITH CHECK (public.user_belongs_to_barbershop(barbershop_id));

-- Permitir inserção de mensagens
CREATE POLICY "Users can insert whatsapp messages" 
ON public.whatsapp_messages 
FOR INSERT 
WITH CHECK (public.user_belongs_to_barbershop(barbershop_id));