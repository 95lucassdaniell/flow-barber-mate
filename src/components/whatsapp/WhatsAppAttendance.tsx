import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import ConversationsList from './ConversationsList';
import ChatInterface from './ChatInterface';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, MessageSquare, TrendingUp } from 'lucide-react';

const WhatsAppAttendance: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const {
    conversations,
    tags,
    loading,
    error,
    takeoverConversation,
    releaseConversation,
    applyTag,
    removeTag,
    sendMessage
  } = useWhatsAppConversations();

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Estatísticas rápidas
  const stats = {
    total: conversations.length,
    aiManaged: conversations.filter(c => !c.human_takeover).length,
    humanManaged: conversations.filter(c => c.human_takeover).length,
    unread: conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)
  };

  if (error) {
    return (
      <DashboardLayout activeTab="whatsapp">
        <Card className="p-6">
          <div className="text-center text-red-600">
            <MessageSquare className="h-12 w-12 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar conversas</h3>
            <p>{error}</p>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="whatsapp">
      <div className="space-y-6 h-full">
        {/* Header com estatísticas */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Atendimento WhatsApp</h1>
            <p className="text-muted-foreground">
              Gerencie conversas com IA e atendimento humano
            </p>
          </div>

          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.aiManaged}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Bot className="h-3 w-3" />
                IA Ativa
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.humanManaged}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Humano
              </div>
            </div>
            {stats.unread > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
                <div className="text-sm text-muted-foreground">Não lidas</div>
              </div>
            )}
          </div>
        </div>

        {/* Interface principal estilo WhatsApp Business */}
        <div className="flex h-[calc(100vh-200px)] border rounded-lg overflow-hidden bg-card">
          <ConversationsList
            conversations={conversations}
            tags={tags}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            loading={loading}
          />
          
          <ChatInterface
            conversation={selectedConv || null}
            tags={tags}
            onTakeOver={takeoverConversation}
            onRelease={releaseConversation}
            onApplyTag={applyTag}
            onRemoveTag={removeTag}
            onSendMessage={sendMessage}
          />
        </div>

        {/* Status da IA */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-500" />
              <span className="font-medium">Status da IA</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Ativa
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{Math.round((stats.aiManaged / (stats.total || 1)) * 100)}% das conversas automatizadas</span>
              </div>
              <div>
                <span>Tempo médio de resposta: ~2s</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppAttendance;