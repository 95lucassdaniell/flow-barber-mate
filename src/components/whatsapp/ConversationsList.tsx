import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MessageSquare, Bot, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppConversation, WhatsAppTag } from '@/hooks/useWhatsAppConversations';

interface ConversationsListProps {
  conversations: WhatsAppConversation[];
  tags: WhatsAppTag[];
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
  loading: boolean;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  tags,
  selectedConversation,
  onSelectConversation,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchTerm || 
      conv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.client_phone.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'ai' && !conv.human_takeover) ||
      (filterStatus === 'human' && conv.human_takeover) ||
      (filterStatus === 'unread' && (conv.unread_count || 0) > 0);

    const matchesTag = filterTag === 'all' || 
      conv.tags?.some(tag => tag.id === filterTag);

    return matchesSearch && matchesStatus && matchesTag;
  });

  const getStatusIcon = (conversation: WhatsAppConversation) => {
    if (conversation.human_takeover) {
      return <User className="h-4 w-4 text-blue-500" />;
    }
    return <Bot className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = (conversation: WhatsAppConversation) => {
    if (conversation.human_takeover) {
      return 'Atendimento Humano';
    }
    return 'IA Ativa';
  };

  const getLastMessagePreview = (conversation: WhatsAppConversation) => {
    if (!conversation.lastMessage) return 'Nenhuma mensagem';
    
    const content = conversation.lastMessage.content;
    if (typeof content === 'string') {
      return content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
    if (content?.text) {
      return content.text.substring(0, 50) + (content.text.length > 50 ? '...' : '');
    }
    return 'Mensagem sem texto';
  };

  if (loading) {
    return (
      <Card className="w-1/3 border-r rounded-none">
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-1/3 border-r rounded-none h-full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b bg-muted/50">
          <h2 className="text-lg font-semibold mb-3">Conversas WhatsApp</h2>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ai">IA Ativa</SelectItem>
                <SelectItem value="human">Atendimento Humano</SelectItem>
                <SelectItem value="unread">Não Lidas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {tags.map(tag => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <Button
                key={conversation.id}
                variant="ghost"
                className={`w-full p-4 h-auto justify-start rounded-none border-b hover:bg-muted/50 ${
                  selectedConversation === conversation.id ? 'bg-muted' : ''
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start space-x-3 w-full">
                  <Avatar className="mt-1">
                    <AvatarFallback className="text-xs">
                      {conversation.client_name?.charAt(0) || conversation.client_phone.slice(-2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm truncate">
                        {conversation.client_name || conversation.client_phone}
                      </h3>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(conversation)}
                        {(conversation.unread_count || 0) > 0 && (
                          <Badge variant="destructive" className="text-xs px-1 py-0 h-5 min-w-5">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {getLastMessagePreview(conversation)}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {conversation.tags?.slice(0, 2).map(tag => (
                          <Badge 
                            key={tag.id} 
                            variant="secondary" 
                            className="text-xs px-1 py-0 h-4"
                            style={{ 
                              backgroundColor: tag.color + '20',
                              color: tag.color,
                              borderColor: tag.color
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {(conversation.tags?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                            +{(conversation.tags?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(conversation.last_message_at), 'HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

export default ConversationsList;