import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Bot, 
  User, 
  MoreVertical, 
  Tag, 
  UserCheck, 
  UserX,
  Clock,
  Phone,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppConversation, WhatsAppTag } from '@/hooks/useWhatsAppConversations';
import { useWhatsAppMessages } from '@/hooks/useWhatsAppMessages';

interface ChatInterfaceProps {
  conversation: WhatsAppConversation | null;
  tags: WhatsAppTag[];
  onTakeOver: (conversationId: string) => void;
  onRelease: (conversationId: string) => void;
  onApplyTag: (conversationId: string, tagId: string) => void;
  onRemoveTag: (conversationId: string, tagId: string) => void;
  onSendMessage: (conversationId: string, content: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  tags,
  onTakeOver,
  onRelease,
  onApplyTag,
  onRemoveTag,
  onSendMessage
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading: messagesLoading } = useWhatsAppMessages();

  // Filtrar mensagens da conversa atual
  const conversationMessages = conversation 
    ? messages.filter(msg => msg.conversation_id === conversation.id)
    : [];

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
      setMessage('');
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

  const getMessageContent = (msgContent: any) => {
    if (typeof msgContent === 'string') return msgContent;
    if (msgContent?.text) return msgContent.text;
    if (msgContent?.body) return msgContent.body;
    return 'Mensagem não suportada';
  };

  if (!conversation) {
    return (
      <Card className="flex-1 rounded-none flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
          <p>Escolha uma conversa para começar o atendimento</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 rounded-none flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                {conversation.client_name?.charAt(0) || conversation.client_phone.slice(-2)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-semibold">
                {conversation.client_name || 'Cliente'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{conversation.client_phone}</span>
                <Separator orientation="vertical" className="h-3" />
                {conversation.human_takeover ? (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-blue-500" />
                    <span className="text-blue-600">Atendimento Humano</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Bot className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">IA Ativa</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {conversation.human_takeover ? (
                <DropdownMenuItem onClick={() => onRelease(conversation.id)}>
                  <UserX className="h-4 w-4 mr-2" />
                  Liberar para IA
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onTakeOver(conversation.id)}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assumir Controle
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Tag className="h-4 w-4 mr-2" />
                Gerenciar Etiquetas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {conversation.tags && conversation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {conversation.tags.map(tag => (
              <Badge 
                key={tag.id}
                variant="secondary"
                className="text-xs cursor-pointer hover:opacity-80"
                style={{ 
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                  borderColor: tag.color
                }}
                onClick={() => onRemoveTag(conversation.id, tag.id)}
              >
                {tag.name} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-muted/20 to-transparent">
        {messagesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className="bg-gray-200 rounded-lg p-3 max-w-xs">
                    <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversationMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma mensagem nesta conversa</p>
          </div>
        ) : (
          conversationMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.direction === 'outgoing' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card border'
              }`}>
                <div className="text-sm">
                  {getMessageContent(msg.content)}
                </div>
                <div className="flex items-center justify-between mt-1 text-xs opacity-70">
                  <div className="flex items-center gap-1">
                    {msg.ai_handled && msg.direction === 'outgoing' && (
                      <Bot className="h-3 w-3" />
                    )}
                    {msg.human_agent_id && msg.direction === 'outgoing' && (
                      <User className="h-3 w-3" />
                    )}
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-card">
        {!conversation.human_takeover && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <Bot className="h-4 w-4" />
              <span className="text-sm font-medium">IA está gerenciando esta conversa</span>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Assuma o controle para enviar mensagens manuais
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            placeholder={
              conversation.human_takeover 
                ? "Digite sua mensagem..." 
                : "Assuma o controle para enviar mensagens"
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!conversation.human_takeover || isTyping}
            className="resize-none min-h-[60px]"
            rows={2}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || !conversation.human_takeover || isTyping}
            size="icon"
            className="self-end h-[60px] w-12"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;