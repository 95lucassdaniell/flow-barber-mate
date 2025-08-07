import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Bot, User, Clock, MessageCircle } from "lucide-react";
import { WhatsAppConversation, WhatsAppTag } from "@/hooks/useWhatsAppConversations";

interface AttendanceConversationsListProps {
  conversations: WhatsAppConversation[];
  tags: WhatsAppTag[];
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
  loading: boolean;
  isRetrying?: boolean;
  retryCount?: number;
}

export const AttendanceConversationsList = ({
  conversations,
  tags,
  selectedConversation,
  onSelectConversation,
  loading,
  isRetrying = false,
  retryCount = 0
}: AttendanceConversationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = !searchTerm || 
      conversation.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.client_phone.includes(searchTerm);
    
    const matchesStatus = !filterStatus || 
      (filterStatus === "ai" && conversation.ai_enabled && !conversation.human_takeover) ||
      (filterStatus === "human" && conversation.human_takeover) ||
      (filterStatus === "active" && conversation.status === "active");
    
    const matchesTag = !filterTag || 
      conversation.tags?.some(tag => tag.id === filterTag);
    
    return matchesSearch && matchesStatus && matchesTag;
  });

  const getStatusIcon = (conversation: WhatsAppConversation) => {
    if (conversation.human_takeover) {
      return <User className="w-4 h-4 text-green-500" />;
    }
    if (conversation.ai_enabled) {
      return <Bot className="w-4 h-4 text-blue-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getLastMessagePreview = (conversation: WhatsAppConversation) => {
    if (conversation.lastMessage) {
      const content = conversation.lastMessage.content;
      return content.length > 50 ? content.substring(0, 50) + "..." : content;
    }
    return "Nenhuma mensagem";
  };

  if (loading) {
    return (
      <Card className="h-full rounded-none border-0 border-r">
        <CardHeader className="pb-4">
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-none border-0 border-r">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2 mb-3">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Conversas</h2>
          <Badge variant="secondary">{filteredConversations.length}</Badge>
          {isRetrying && (
            <Badge variant="outline" className="text-xs">
              Retry {retryCount}/3
            </Badge>
          )}
        </div>
        
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex space-x-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="ai">IA</SelectItem>
              <SelectItem value="human">Humano</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="h-full overflow-auto pb-0">
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <Button
              key={conversation.id}
              variant={selectedConversation === conversation.id ? "secondary" : "ghost"}
              className="w-full p-3 h-auto text-left justify-start hover:bg-muted/50"
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-start space-x-3 w-full">
                <div className="mt-1">
                  {getStatusIcon(conversation)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm truncate">
                      {conversation.client_name || conversation.client_phone}
                    </p>
                    <div className="flex items-center space-x-1">
                      {conversation.status === 'active' && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {getLastMessagePreview(conversation)}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      {conversation.tags?.slice(0, 2).map((tag) => (
                        <Badge 
                          key={tag.id} 
                          variant="outline" 
                          className="text-xs px-1 py-0"
                          style={{ 
                            borderColor: tag.color,
                            color: tag.color 
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                    
                    {conversation.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.lastMessage.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Button>
          ))}
          
          {filteredConversations.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterStatus || filterTag 
                  ? "Nenhuma conversa encontrada" 
                  : "Nenhuma conversa disponível"
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};