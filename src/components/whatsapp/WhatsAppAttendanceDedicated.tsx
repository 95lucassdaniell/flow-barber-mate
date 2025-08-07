import { useState } from "react";
import { AttendanceLayout } from "./attendance/AttendanceLayout";
import { AttendanceConversationsList } from "./attendance/AttendanceConversationsList";
import { AttendanceChatInterface } from "./attendance/AttendanceChatInterface";
import { AttendanceHeader } from "./attendance/AttendanceHeader";
import { useWhatsAppConversations } from "@/hooks/useWhatsAppConversations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const WhatsAppAttendanceDedicated = () => {
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

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  if (error) {
    return (
      <AttendanceLayout>
        <div className="flex items-center justify-center h-full">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar conversas: {error}
            </AlertDescription>
          </Alert>
        </div>
      </AttendanceLayout>
    );
  }

  const stats = {
    totalConversations: conversations.length,
    aiManaged: conversations.filter(c => c.ai_enabled && !c.human_takeover).length,
    humanManaged: conversations.filter(c => c.human_takeover).length,
    unreadCount: conversations.filter(c => c.status === 'active').length
  };

  return (
    <AttendanceLayout>
      <div className="flex flex-col h-full">
        <AttendanceHeader stats={stats} />
        
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 border-r border-border flex-shrink-0">
            <AttendanceConversationsList
              conversations={conversations}
              tags={tags}
              selectedConversation={selectedConversation}
              onSelectConversation={setSelectedConversation}
              loading={loading}
            />
          </div>
          
          <div className="flex-1">
            <AttendanceChatInterface
              conversation={selectedConversationData}
              tags={tags}
              onTakeOver={takeoverConversation}
              onRelease={releaseConversation}
              onApplyTag={applyTag}
              onRemoveTag={removeTag}
              onSendMessage={sendMessage}
            />
          </div>
        </div>
      </div>
    </AttendanceLayout>
  );
};

export default WhatsAppAttendanceDedicated;