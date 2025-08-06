-- Adicionar constraint único para permitir upsert na tabela whatsapp_conversations
ALTER TABLE public.whatsapp_conversations 
ADD CONSTRAINT whatsapp_conversations_barbershop_phone_unique 
UNIQUE (barbershop_id, client_phone);

-- Criar função para migrar mensagens existentes sem conversation_id
CREATE OR REPLACE FUNCTION public.create_conversations_for_existing_messages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  message_record RECORD;
  conv_id uuid;
  created_count integer := 0;
BEGIN
  -- Buscar mensagens sem conversation_id
  FOR message_record IN 
    SELECT DISTINCT phone_number, barbershop_id, MIN(created_at) as first_message_at
    FROM public.whatsapp_messages 
    WHERE conversation_id IS NULL
    GROUP BY phone_number, barbershop_id
  LOOP
    -- Criar conversa para cada número único por barbearia
    INSERT INTO public.whatsapp_conversations (
      barbershop_id,
      client_phone,
      client_name,
      status,
      ai_enabled,
      human_takeover,
      created_at,
      last_message_at
    ) VALUES (
      message_record.barbershop_id,
      message_record.phone_number,
      message_record.phone_number, -- Usar número como nome temporário
      'active',
      true,
      false,
      message_record.first_message_at,
      message_record.first_message_at
    )
    ON CONFLICT (barbershop_id, client_phone) DO NOTHING
    RETURNING id INTO conv_id;
    
    -- Se conv_id é null, significa que já existia, buscar o ID
    IF conv_id IS NULL THEN
      SELECT id INTO conv_id 
      FROM public.whatsapp_conversations 
      WHERE barbershop_id = message_record.barbershop_id 
      AND client_phone = message_record.phone_number;
    END IF;
    
    -- Atualizar mensagens para associar à conversa
    UPDATE public.whatsapp_messages 
    SET conversation_id = conv_id
    WHERE phone_number = message_record.phone_number 
    AND barbershop_id = message_record.barbershop_id
    AND conversation_id IS NULL;
    
    created_count := created_count + 1;
  END LOOP;
  
  RETURN created_count;
END;
$function$;

-- Executar a migração das mensagens existentes
SELECT public.create_conversations_for_existing_messages();