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
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const barbershopId = profile?.barbershop_id;

  const fetchConversations = async (attemptNumber = 0) => {
    const maxRetries = 3;
    const isRetryAttempt = attemptNumber > 0;
    
    console.log('🔍 fetchConversations iniciado', { 
      barbershopId, 
      user: user?.id, 
      profile: profile?.id, 
      attempt: attemptNumber + 1,
      authLoading 
    });
    
    // Se ainda estiver carregando auth e for primeira tentativa, aguardar
    if (authLoading && attemptNumber === 0) {
      console.log('⏳ Aguardando autenticação completar...');
      setTimeout(() => fetchConversations(0), 1000);
      return;
    }
    
    if (!barbershopId) {
      if (attemptNumber < maxRetries) {
        console.warn(`⚠️ Tentativa ${attemptNumber + 1}: barbershop_id não disponível, tentando novamente em 2s...`);
        setIsRetrying(true);
        setTimeout(() => {
          setRetryCount(attemptNumber + 1);
          fetchConversations(attemptNumber + 1);
        }, 2000);
        return;
      }
      
      console.error('❌ Falha final: ID da barbearia não encontrado após tentativas');
      setError('ID da barbearia não encontrado. Faça logout e login novamente.');
      setLoading(false);
      setIsRetrying(false);
      return;
    }

    try {
      if (!isRetryAttempt) {
        setLoading(true);
      }
      setError(null);
      setIsRetrying(isRetryAttempt);
      console.log(`📡 Buscando conversas para barbershop_id: ${barbershopId} (tentativa ${attemptNumber + 1})`);

      // Buscar conversas básicas primeiro
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('last_message_at', { ascending: false });

      if (conversationsError) {
        console.error('❌ Erro na consulta de conversas:', conversationsError);
        console.error('❌ Tipo de erro:', conversationsError.code);
        console.error('❌ Mensagem:', conversationsError.message);
        console.error('❌ Detalhes:', conversationsError.details);
        
        // Sempre tentar fallback em caso de erro
        try {
          console.log('🔄 Tentando fallback com função RPC...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .rpc('get_whatsapp_conversations_debug', { p_barbershop_id: barbershopId });
          
          if (fallbackError) {
            console.error('❌ Fallback RPC também falhou:', fallbackError);
            throw new Error(`Erro RLS: ${conversationsError.message}. Fallback falhou: ${fallbackError.message}`);
          }
          
          console.log('✅ Fallback RPC funcionou! Encontradas', fallbackData?.length || 0, 'conversas');
          
          // Usar dados do fallback se disponível
          if (fallbackData && Array.isArray(fallbackData)) {
            const conversationsWithDefaults = fallbackData.map(conv => ({
              ...conv,
              status: conv.status as 'active' | 'archived' | 'blocked',
              tags: [],
              lastMessage: undefined,
              unread_count: 0
            }));
            
            console.log('✅ Usando dados do fallback RPC');
            setConversations(conversationsWithDefaults);
            setLoading(false);
            return;
          }
        } catch (fallbackError) {
          console.error('❌ Erro no fallback RPC:', fallbackError);
          throw conversationsError;
        }
      }

      if (!conversationsData || conversationsData.length === 0) {
        console.log('ℹ️ Nenhuma conversa encontrada');
        setConversations([]);
        return;
      }

      // Buscar todas as tags das conversas em uma única query
      const conversationIds = conversationsData.map(conv => conv.id);
      const { data: allConversationTags } = await supabase
        .from('whatsapp_conversation_tags')
        .select('conversation_id, tag_id')
        .in('conversation_id', conversationIds);

      // Buscar todas as tags referenciadas
      const tagIds = [...new Set(allConversationTags?.map(ct => ct.tag_id) || [])];
      const { data: allTags } = await supabase
        .from('whatsapp_tags')
        .select('*')
        .in('id', tagIds);

      // Criar um mapa de tags por ID para lookup eficiente
      const tagMap = new Map(allTags?.map(tag => [tag.id, tag]) || []);

      // Buscar última mensagem e montar resultado final
      const conversationsWithMessages = await Promise.all(
        conversationsData.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Contar mensagens não lidas (incoming e não vistas por humano)
          const { count: unreadCount } = await supabase
            .from('whatsapp_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('direction', 'incoming')
            .is('human_agent_id', null);

          // Buscar tags da conversa usando os dados já carregados
          const conversationTagIds = allConversationTags
            ?.filter(ct => ct.conversation_id === conv.id)
            ?.map(ct => ct.tag_id) || [];
          
          const conversationTags = conversationTagIds
            .map(tagId => tagMap.get(tagId))
            .filter(Boolean);

          return {
            ...conv,
            status: conv.status as 'active' | 'archived' | 'blocked',
            tags: conversationTags || [],
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
      setRetryCount(0);
      setIsRetrying(false);
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
      
      // Retry logic para erros críticos
      if (attemptNumber < maxRetries && (
        err.code === 'PGRST103' || 
        err.message?.includes('policy') ||
        err.message?.includes('permission')
      )) {
        const retryDelay = Math.min(2000 * Math.pow(2, attemptNumber), 8000);
        console.log(`🔄 Retry automático em ${retryDelay}ms (tentativa ${attemptNumber + 1}/${maxRetries})`);
        setIsRetrying(true);
        setTimeout(() => {
          setRetryCount(attemptNumber + 1);
          fetchConversations(attemptNumber + 1);
        }, retryDelay);
        return;
      }
      
      setError(errorMessage);
      setIsRetrying(false);
    } finally {
      if (!isRetryAttempt || attemptNumber >= maxRetries) {
        setLoading(false);
      }
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

  // Real-time subscription with debouncing
  useEffect(() => {
    if (!barbershopId) return;

    let fetchTimeout: NodeJS.Timeout;
    
    const debouncedFetch = () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        fetchConversations();
      }, 1000); // Debounce real-time updates
    };

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
        (payload) => {
          console.log('🔄 Conversa atualizada:', payload);
          debouncedFetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        (payload) => {
          console.log('🔄 Mensagem atualizada:', payload);
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      supabase.removeChannel(channel);
    };
  }, [barbershopId]);

  useEffect(() => {
    console.log('📋 useWhatsAppConversations useEffect executado', { 
      barbershopId,
      userId: user?.id,
      profileId: profile?.id,
      isAuthenticated: !!user,
      authLoading
    });
    
    // Aguardar tanto o fim do carregamento quanto o profile estar disponível
    if (!authLoading && user && profile && barbershopId) {
      console.log('✅ Condições atendidas, iniciando fetch de conversas');
      fetchConversations();
      fetchTags();
    } else if (!authLoading && user && !profile) {
      // Dar tempo adicional para o profile carregar após a autenticação
      console.log('⏳ Usuário autenticado, aguardando profile carregar...');
      const profileTimeout = setTimeout(() => {
        if (!profile) {
          console.warn('⚠️ Timeout: Profile não carregou após 5 segundos');
          setError('Erro ao carregar perfil. Faça logout e login novamente.');
          setLoading(false);
        }
      }, 5000);
      
      // Cleanup do timeout se o componente for desmontado
      return () => clearTimeout(profileTimeout);
    } else if (!authLoading && user && profile && !barbershopId) {
      console.warn('⚠️ Usuário autenticado com profile mas sem barbershop_id');
      setError('Perfil incompleto. Entre em contato com o suporte.');
      setLoading(false);
    } else if (!authLoading && !user) {
      console.warn('⚠️ Usuário não autenticado');
      setError('Usuário não autenticado');
      setLoading(false);
    } else {
      console.log('⏳ Aguardando autenticação e profile completarem...', {
        authLoading,
        hasUser: !!user,
        hasProfile: !!profile,
        hasBarbershopId: !!barbershopId
      });
    }
  }, [barbershopId, authLoading, user, profile]);

  const manualRetry = () => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
    setIsRetrying(false);
    fetchConversations(0);
  };

  return {
    conversations,
    tags,
    loading,
    error,
    retryCount,
    isRetrying,
    refetch: fetchConversations,
    manualRetry,
    takeoverConversation,
    releaseConversation,
    applyTag,
    removeTag,
    sendMessage
  };
};