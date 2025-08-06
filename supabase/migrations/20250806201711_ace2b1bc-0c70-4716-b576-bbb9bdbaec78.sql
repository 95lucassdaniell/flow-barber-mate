-- Criar função RPC para buscar conversas contornando problemas de RLS
CREATE OR REPLACE FUNCTION public.get_whatsapp_conversations_debug(p_barbershop_id uuid)
RETURNS TABLE(
  id uuid,
  barbershop_id uuid,
  client_phone text,
  client_name text,
  status text,
  ai_enabled boolean,
  human_takeover boolean,
  human_agent_id uuid,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
$function$;