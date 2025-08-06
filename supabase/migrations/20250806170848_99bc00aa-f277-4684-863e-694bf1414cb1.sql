-- Tabela para agrupar conversas do WhatsApp
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL,
  client_phone TEXT NOT NULL,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, archived, blocked
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  human_takeover BOOLEAN NOT NULL DEFAULT false,
  human_agent_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para etiquetas do WhatsApp
CREATE TABLE public.whatsapp_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false, -- para etiquetas do sistema (criadas automaticamente)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para relacionar conversas com etiquetas
CREATE TABLE public.whatsapp_conversation_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  applied_by UUID, -- user_id que aplicou a etiqueta (null se foi automático)
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, tag_id)
);

-- Tabela para contexto da IA
CREATE TABLE public.whatsapp_ai_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  context_data JSONB NOT NULL DEFAULT '{}',
  intent TEXT, -- agendar, cancelar, remarcar, duvida, etc
  collected_data JSONB NOT NULL DEFAULT '{}', -- nome, servico, barbeiro, data, hora
  step TEXT, -- etapa atual da conversa
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atualizar tabela whatsapp_messages para incluir conversation_id
ALTER TABLE public.whatsapp_messages ADD COLUMN conversation_id UUID;
ALTER TABLE public.whatsapp_messages ADD COLUMN ai_handled BOOLEAN DEFAULT false;
ALTER TABLE public.whatsapp_messages ADD COLUMN human_agent_id UUID;

-- Índices para performance
CREATE INDEX idx_whatsapp_conversations_barbershop_phone ON public.whatsapp_conversations(barbershop_id, client_phone);
CREATE INDEX idx_whatsapp_conversations_status ON public.whatsapp_conversations(status);
CREATE INDEX idx_whatsapp_conversations_last_message ON public.whatsapp_conversations(last_message_at DESC);
CREATE INDEX idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_ai_context_conversation ON public.whatsapp_ai_context(conversation_id);

-- Habilitar RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_ai_context ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_conversations
CREATE POLICY "Users can view conversations from their barbershop" 
ON public.whatsapp_conversations 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage conversations in their barbershop" 
ON public.whatsapp_conversations 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- Políticas RLS para whatsapp_tags
CREATE POLICY "Users can view tags from their barbershop" 
ON public.whatsapp_tags 
FOR SELECT 
USING (barbershop_id = get_user_barbershop_id());

CREATE POLICY "Admins can manage tags in their barbershop" 
ON public.whatsapp_tags 
FOR ALL 
USING (barbershop_id = get_user_barbershop_id() AND is_user_admin());

-- Políticas RLS para whatsapp_conversation_tags
CREATE POLICY "Users can view conversation tags from their barbershop" 
ON public.whatsapp_conversation_tags 
FOR SELECT 
USING (conversation_id IN (
  SELECT id FROM public.whatsapp_conversations 
  WHERE barbershop_id = get_user_barbershop_id()
));

CREATE POLICY "Users can manage conversation tags in their barbershop" 
ON public.whatsapp_conversation_tags 
FOR ALL 
USING (conversation_id IN (
  SELECT id FROM public.whatsapp_conversations 
  WHERE barbershop_id = get_user_barbershop_id()
));

-- Políticas RLS para whatsapp_ai_context
CREATE POLICY "Users can view AI context from their barbershop" 
ON public.whatsapp_ai_context 
FOR SELECT 
USING (conversation_id IN (
  SELECT id FROM public.whatsapp_conversations 
  WHERE barbershop_id = get_user_barbershop_id()
));

CREATE POLICY "System can manage AI context" 
ON public.whatsapp_ai_context 
FOR ALL 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_conversations_updated_at
BEFORE UPDATE ON public.whatsapp_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_ai_context_updated_at
BEFORE UPDATE ON public.whatsapp_ai_context
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir etiquetas padrão do sistema
INSERT INTO public.whatsapp_tags (barbershop_id, name, color, description, is_system)
SELECT DISTINCT barbershop_id, 'Novo Cliente', '#10B981', 'Cliente que entrou em contato pela primeira vez', true
FROM public.whatsapp_instances
WHERE barbershop_id IS NOT NULL;

INSERT INTO public.whatsapp_tags (barbershop_id, name, color, description, is_system)
SELECT DISTINCT barbershop_id, 'Quer Agendar', '#3B82F6', 'Cliente demonstrou interesse em agendar', true
FROM public.whatsapp_instances
WHERE barbershop_id IS NOT NULL;

INSERT INTO public.whatsapp_tags (barbershop_id, name, color, description, is_system)
SELECT DISTINCT barbershop_id, 'Agendamento Confirmado', '#059669', 'Agendamento realizado com sucesso', true
FROM public.whatsapp_instances
WHERE barbershop_id IS NOT NULL;

INSERT INTO public.whatsapp_tags (barbershop_id, name, color, description, is_system)
SELECT DISTINCT barbershop_id, 'Remarcar', '#F59E0B', 'Cliente quer remarcar agendamento', true
FROM public.whatsapp_instances
WHERE barbershop_id IS NOT NULL;

INSERT INTO public.whatsapp_tags (barbershop_id, name, color, description, is_system)
SELECT DISTINCT barbershop_id, 'Cancelar', '#DC2626', 'Cliente quer cancelar agendamento', true
FROM public.whatsapp_instances
WHERE barbershop_id IS NOT NULL;

INSERT INTO public.whatsapp_tags (barbershop_id, name, color, description, is_system)
SELECT DISTINCT barbershop_id, 'Dúvida', '#8B5CF6', 'Cliente tem dúvidas gerais', true
FROM public.whatsapp_instances
WHERE barbershop_id IS NOT NULL;

INSERT INTO public.whatsapp_tags (barbershop_id, name, color, description, is_system)
SELECT DISTINCT barbershop_id, 'Atendimento Humano', '#EF4444', 'Conversa transferida para atendimento humano', true
FROM public.whatsapp_instances
WHERE barbershop_id IS NOT NULL;