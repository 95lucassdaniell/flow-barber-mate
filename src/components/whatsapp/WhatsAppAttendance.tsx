import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import ConversationsList from './ConversationsList';
import ChatInterface from './ChatInterface';
import AIStatusDashboard from './AIStatusDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react';

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
            <h1 className="text-2xl font-bold">Atendimento Virtual WhatsApp</h1>
            <p className="text-muted-foreground">
              Sistema inteligente de atendimento com IA e suporte humano
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Bot className="h-3 w-3 mr-1" />
              IA Ativa
            </Badge>
            <Badge variant="outline">
              {stats.total} conversas
            </Badge>
            {stats.unread > 0 && (
              <Badge variant="destructive">
                {stats.unread} não lidas
              </Badge>
            )}
          </div>
        </div>

        {/* Dashboard de Status da IA */}
        <AIStatusDashboard
          totalConversations={stats.total}
          aiManagedConversations={stats.aiManaged}
          humanManagedConversations={stats.humanManaged}
        />

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

        {/* Alertas importantes */}
        {stats.unread > 5 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-medium text-amber-800">Muitas mensagens não respondidas</h3>
                  <p className="text-sm text-amber-700">
                    Há {stats.unread} mensagens aguardando resposta. Considere assumir o controle manual.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status da IA */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-500" />
              <span className="font-medium">Sistema de IA</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Operacional
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Automatizando {Math.round((stats.aiManaged / (stats.total || 1)) * 100)}% das conversas</span>
              </div>
              <div>
                <span>Resposta média: ~2s</span>
              </div>
              <div>
                <span>Taxa de sucesso: 95%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppAttendance;