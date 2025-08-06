import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/components/ui/use-toast";

export interface WhatsAppConversation {
  id: string;
  barbershop_id: string;
  client_phone: string;
  client_name?: string;
  status: 'active' | 'archived' | 'blocked';
  ai_enabled: boolean;
  human_takeover: boolean;
  human_agent_id?: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  tags?: WhatsAppTag[];
  lastMessage?: WhatsAppMessage;
  unread_count?: number;
}

export interface WhatsAppTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  is_system: boolean;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id?: string;
  phone_number: string;
  contact_name?: string;
  content: any;
  message_type: string;
  direction: 'incoming' | 'outgoing';
  status: string;
  ai_handled?: boolean;
  human_agent_id?: string;
  created_at: string;
}

export const useWhatsAppConversations = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [tags, setTags] = useState<WhatsAppTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const barbershopId = profile?.barbershop_id;

  const fetchConversations = async () => {
    console.log('🔍 fetchConversations iniciado', { barbershopId, user: user?.id, profile: profile?.id });
    
    if (!barbershopId) {
      console.warn('⚠️ Nenhum barbershop_id disponível para buscar conversas');
      setError('ID da barbearia não encontrado. Verifique se você está autenticado.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('📡 Buscando conversas para barbershop_id:', barbershopId);

      // Buscar conversas com informações das tags
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *
        `)
        .eq('barbershop_id', barbershopId)
        .order('last_message_at', { ascending: false });

      if (conversationsError) {
        console.error('❌ Erro na consulta de conversas:', conversationsError);
        console.error('❌ Tipo de erro:', conversationsError.code);
        console.error('❌ Mensagem:', conversationsError.message);
        console.error('❌ Detalhes:', conversationsError.details);
        
        // Log adicional para debug de RLS
        if (conversationsError.code === 'PGRST103' || conversationsError.message?.includes('policy')) {
          console.log('🔍 Possível erro de RLS policy - Verificando contexto de autenticação:');
          console.log('- User ID:', user?.id);
          console.log('- Profile ID:', profile?.id);
          console.log('- Barbershop ID:', barbershopId);
          
          // Tentar query simplificada para debug
          try {
            const { count } = await supabase
              .from('whatsapp_conversations')
              .select('*', { count: 'exact', head: true });
            console.log('🔍 Total de conversas (sem filtro):', count);
          } catch (debugError) {
            console.log('🔍 Erro mesmo sem filtro:', debugError);
          }
        }
        
        throw conversationsError;
      }

      // Buscar última mensagem e tags para cada conversa
      const conversationsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Buscar tags da conversa
          const { data: conversationTags } = await supabase
            .from('whatsapp_conversation_tags')
            .select(`
              whatsapp_tags (
                id,
                name,
                color,
                description,
                is_system
              )
            `)
            .eq('conversation_id', conv.id);

          // Contar mensagens não lidas (incoming e não vistas por humano)
          const { count: unreadCount } = await supabase
            .from('whatsapp_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('direction', 'incoming')
            .is('human_agent_id', null);

          return {
            ...conv,
            status: conv.status as 'active' | 'archived' | 'blocked',
            tags: conversationTags?.map((ct: any) => ct.whatsapp_tags).filter(Boolean) || [],
            lastMessage: lastMsg ? {
              ...lastMsg,
              direction: lastMsg.direction as 'incoming' | 'outgoing',
              conversation_id: lastMsg.conversation_id || undefined,
              ai_handled: lastMsg.ai_handled || false,
              human_agent_id: lastMsg.human_agent_id || undefined
            } : undefined,
            unread_count: unreadCount || 0
          };
        })
      );

      console.log('✅ Conversas carregadas com sucesso:', conversationsWithMessages.length);
      setConversations(conversationsWithMessages);
    } catch (err: any) {
      console.error('❌ Error fetching conversations:', err);
      console.error('❌ Detalhes do erro:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      
      // Mensagem de erro mais específica baseada no tipo de erro
      let errorMessage = 'Erro ao carregar conversas';
      if (err.code === 'PGRST103' || err.message?.includes('policy')) {
        errorMessage = 'Erro de permissão - Verifique se você está autenticado corretamente';
      } else if (err.message?.includes('rate limit')) {
        errorMessage = 'Muitas tentativas - Aguarde um momento e tente novamente';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    if (!barbershopId) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_tags')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (err: any) {
      console.error('Error fetching tags:', err);
    }
  };

  const takeoverConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ 
          human_takeover: true,
          human_agent_id: user?.id 
        })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Controle assumido",
        description: "Você agora está controlando esta conversa",
      });

      fetchConversations();
    } catch (err: any) {
      console.error('Error taking over conversation:', err);
      toast({
        title: "Erro",
        description: "Não foi possível assumir o controle da conversa",
        variant: "destructive",
      });
    }
  };

  const releaseConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ 
          human_takeover: false,
          human_agent_id: null 
        })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: "Controle liberado",
        description: "A IA voltou a gerenciar esta conversa",
      });

      fetchConversations();
    } catch (err: any) {
      console.error('Error releasing conversation:', err);
      toast({
        title: "Erro",
        description: "Não foi possível liberar o controle da conversa",
        variant: "destructive",
      });
    }
  };

  const applyTag = async (conversationId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_conversation_tags')
        .upsert({
          conversation_id: conversationId,
          tag_id: tagId,
          applied_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Etiqueta aplicada",
        description: "Etiqueta aplicada com sucesso",
      });

      fetchConversations();
    } catch (err: any) {
      console.error('Error applying tag:', err);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar a etiqueta",
        variant: "destructive",
      });
    }
  };

  const removeTag = async (conversationId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_conversation_tags')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('tag_id', tagId);

      if (error) throw error;

      toast({
        title: "Etiqueta removida",
        description: "Etiqueta removida com sucesso",
      });

      fetchConversations();
    } catch (err: any) {
      console.error('Error removing tag:', err);
      toast({
        title: "Erro",
        description: "Não foi possível remover a etiqueta",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) throw new Error('Conversa não encontrada');

      const { error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phone: conversation.client_phone,
          message: content,
          barbershop_id: barbershopId,
          conversation_id: conversationId,
          human_agent_id: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada",
        description: "Mensagem enviada com sucesso",
      });

      fetchConversations();
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!barbershopId) return;

    const channel = supabase
      .channel('whatsapp-conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
          filter: `barbershop_id=eq.${barbershopId}`,
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbershopId]);

  useEffect(() => {
    console.log('📋 useWhatsAppConversations useEffect executado', { 
      barbershopId,
      userId: user?.id,
      profileId: profile?.id,
      isAuthenticated: !!user 
    });
    
    if (barbershopId) {
      fetchConversations();
      fetchTags();
    } else {
      console.warn('⚠️ barbershopId não disponível, pulando fetch');
    }
  }, [barbershopId]);

  return {
    conversations,
    tags,
    loading,
    error,
    refetch: fetchConversations,
    takeoverConversation,
    releaseConversation,
    applyTag,
    removeTag,
    sendMessage
  };
};