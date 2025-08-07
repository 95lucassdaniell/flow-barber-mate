import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, MessageCircle, Clock } from "lucide-react";

interface AttendanceHeaderProps {
  stats: {
    totalConversations: number;
    aiManaged: number;
    humanManaged: number;
    unreadCount: number;
  };
}

export const AttendanceHeader = ({ stats }: AttendanceHeaderProps) => {
  return (
    <div className="border-b border-border bg-card/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="font-medium">Total:</span>
            <Badge variant="secondary">{stats.totalConversations}</Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-500" />
            <span className="text-sm">IA:</span>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              {stats.aiManaged}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-green-500" />
            <span className="text-sm">Humano:</span>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              {stats.humanManaged}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm">Não lidas:</span>
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
              {stats.unreadCount}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Sistema Online
            </span>
          </div>
          
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            Atendimento Ativo
          </Badge>
        </div>
      </div>
    </div>
  );
};