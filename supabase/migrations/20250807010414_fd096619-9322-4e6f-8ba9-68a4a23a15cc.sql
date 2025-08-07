-- Habilitar real-time para whatsapp_messages
ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.whatsapp_messages;

-- Habilitar real-time para whatsapp_conversations
ALTER TABLE public.whatsapp_conversations REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.whatsapp_conversations;

-- Habilitar real-time para whatsapp_conversation_tags (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_conversation_tags') THEN
        ALTER TABLE public.whatsapp_conversation_tags REPLICA IDENTITY FULL;
        ALTER publication supabase_realtime ADD TABLE public.whatsapp_conversation_tags;
    END IF;
END $$;