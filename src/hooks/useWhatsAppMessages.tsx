import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface WhatsAppMessage {
  id: string;
  phone_number: string;
  contact_name?: string | null;
  content: any; // JSONB field
  message_type: string;
  direction: 'incoming' | 'outgoing';
  status: string;
  message_id?: string | null;
  instance_id?: string | null;
  appointment_id?: string | null;
  client_id?: string | null;
  barbershop_id: string;
  created_at: string;
  conversation_id?: string;
  ai_handled?: boolean;
  human_agent_id?: string;
}

export const useWhatsAppMessages = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const barbershopId = profile?.barbershop_id;

  const fetchMessages = async () => {
    if (!barbershopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('whatsapp_messages')
        .select(`
          *,
          conversation_id
        `)
        .eq('barbershop_id', barbershopId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (queryError) {
        throw queryError;
      }

      const processedMessages = (data || []).map(msg => ({
        ...msg,
        direction: msg.direction as 'incoming' | 'outgoing'
      }));

      console.log('📨 Mensagens carregadas:', {
        total: processedMessages.length,
        withConversationId: processedMessages.filter(m => m.conversation_id).length,
        withoutConversationId: processedMessages.filter(m => !m.conversation_id).length,
        barbershopId
      });

      setMessages(processedMessages);
    } catch (err: any) {
      console.error('Error fetching WhatsApp messages:', err);
      setError(err.message || 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [barbershopId]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!barbershopId) return;

    const channel = supabase
      .channel('whatsapp-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `barbershop_id=eq.${barbershopId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barbershopId]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
  };
};