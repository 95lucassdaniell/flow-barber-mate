import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useWhatsAppMessages } from "@/hooks/useWhatsAppMessages";
import { 
  Send, 
  MoreVertical, 
  Bot, 
  User, 
  Phone, 
  Tag, 
  MessageCircle,
  Clock
} from "lucide-react";
import { WhatsAppConversation, WhatsAppTag } from "@/hooks/useWhatsAppConversations";

interface AttendanceChatInterfaceProps {
  conversation?: WhatsAppConversation;
  tags: WhatsAppTag[];
  onTakeOver: (conversationId: string) => Promise<void>;
  onRelease: (conversationId: string) => Promise<void>;
  onApplyTag: (conversationId: string, tagId: string) => Promise<void>;
  onRemoveTag: (conversationId: string, tagId: string) => Promise<void>;
  onSendMessage: (conversationId: string, content: string) => Promise<void>;
}

export const AttendanceChatInterface = ({
  conversation,
  tags,
  onTakeOver,
  onRelease,
  onApplyTag,
  onRemoveTag,
  onSendMessage
}: AttendanceChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, loading: messagesLoading } = useWhatsAppMessages();
  
  // Função para normalizar números de telefone
  const normalizePhone = (phone: string) => {
    return phone.replace(/\D/g, ''); // Remove tudo que não é dígito
  };
  
  const conversationMessages = messages.filter(msg => {
    if (!conversation) return false;
    
    // 1. Primeiro, tentar filtrar por conversation_id (método preferido)
    if (msg.conversation_id && conversation.id) {
      const match = msg.conversation_id === conversation.id;
      if (match) {
        console.log('✅ Mensagem encontrada por conversation_id:', msg.id);
        return true;
      }
    }
    
    // 2. Fallback: comparar números de telefone normalizados
    const msgPhone = normalizePhone(msg.phone_number || '');
    const convPhone = normalizePhone(conversation.client_phone || '');
    
    const phoneMatch = msgPhone === convPhone;
    if (phoneMatch) {
      console.log('✅ Mensagem encontrada por telefone normalizado:', msg.id, { msgPhone, convPhone });
    }
    
    return phoneMatch;
  });

  // Debug das mensagens filtradas
  useEffect(() => {
    if (conversation) {
      console.log('🔍 AttendanceChatInterface Debug:', {
        conversationId: conversation.id,
        conversationPhone: conversation.client_phone,
        totalMessages: messages.length,
        filteredMessages: conversationMessages.length,
        messagesWithConvId: messages.filter(m => m.conversation_id).length,
        messagesForThisConv: messages.filter(m => m.conversation_id === conversation.id).length
      });
    }
  }, [conversation, messages, conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !conversation) return;
    
    setIsTyping(true);
    try {
      await onSendMessage(conversation.id, message);
      setMessage("");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageContent = (msg: any) => {
    if (typeof msg.content === 'string') {
      return msg.content;
    }
    if (msg.content?.text) {
      return msg.content.text;
    }
    return JSON.stringify(msg.content);
  };

  if (!conversation) {
    return (
      <Card className="h-full rounded-none border-0 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
          <p className="text-muted-foreground">
            Escolha uma conversa da lista para iniciar o atendimento
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-none border-0 flex flex-col">
      {/* Chat Header */}
      <CardHeader className="border-b shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-medium">
              {conversation.client_name?.charAt(0) || conversation.client_phone.charAt(-2)}
            </div>
            
            <div>
              <h3 className="font-semibold">
                {conversation.client_name || "Cliente"}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>{conversation.client_phone}</span>
                
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                
                {conversation.human_takeover ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <User className="w-3 h-3" />
                    <span>Atendimento Humano</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-blue-600">
                    <Bot className="w-3 h-3" />
                    <span>Atendimento IA</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Applied Tags */}
            <div className="flex space-x-1">
              {conversation.tags?.map((tag) => (
                <Badge 
                  key={tag.id}
                  variant="outline"
                  style={{ 
                    borderColor: tag.color,
                    color: tag.color 
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {conversation.human_takeover ? (
                  <DropdownMenuItem onClick={() => onRelease(conversation.id)}>
                    <Bot className="w-4 h-4 mr-2" />
                    Passar para IA
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onTakeOver(conversation.id)}>
                    <User className="w-4 h-4 mr-2" />
                    Assumir Conversa
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {tags.map((tag) => {
                  const isApplied = conversation.tags?.some(t => t.id === tag.id);
                  return (
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={() => isApplied 
                        ? onRemoveTag(conversation.id, tag.id)
                        : onApplyTag(conversation.id, tag.id)
                      }
                    >
                      <Tag className="w-4 h-4 mr-2" style={{ color: tag.color }} />
                      {isApplied ? "Remover" : "Aplicar"} {tag.name}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Carregando mensagens...</div>
              </div>
            ) : conversationMessages.length > 0 ? (
              <>
                <div className="text-xs text-muted-foreground text-center mb-4 p-2 bg-muted/30 rounded">
                  {conversationMessages.length} mensagens encontradas
                </div>
                {conversationMessages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.direction === 'outgoing'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{getMessageContent(msg)}</p>
                    <p className={`text-xs mt-1 ${
                      msg.direction === 'outgoing' 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
                  <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/20 rounded max-w-md">
                    <p><strong>Debug Info:</strong></p>
                    <p>Conversa ID: {conversation?.id}</p>
                    <p>Telefone: {conversation?.client_phone}</p>
                    <p>Total mensagens: {messages.length}</p>
                    <p>Mensagens filtradas: {conversationMessages.length}</p>
                    <p>Com conversation_id: {messages.filter(m => m.conversation_id).length}</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Textarea
                placeholder={
                  conversation.human_takeover 
                    ? "Digite sua mensagem..." 
                    : "Assumir conversa para enviar mensagens"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!conversation.human_takeover || isTyping}
                className="resize-none"
                rows={2}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || !conversation.human_takeover || isTyping}
                size="sm"
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {!conversation.human_takeover && (
              <p className="text-xs text-muted-foreground mt-2">
                Assumir a conversa para poder enviar mensagens
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};