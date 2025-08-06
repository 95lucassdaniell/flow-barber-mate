import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, MessageSquare, Clock, TrendingUp, Users, Zap } from 'lucide-react';

interface AIStatusDashboardProps {
  totalConversations: number;
  aiManagedConversations: number;
  humanManagedConversations: number;
  averageResponseTime?: number;
  successRate?: number;
}

const AIStatusDashboard: React.FC<AIStatusDashboardProps> = ({
  totalConversations,
  aiManagedConversations,
  humanManagedConversations,
  averageResponseTime = 2,
  successRate = 95
}) => {
  const automationRate = totalConversations > 0 
    ? Math.round((aiManagedConversations / totalConversations) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Conversas Ativas
          </CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalConversations}</div>
          <p className="text-xs text-muted-foreground">
            Total de conversas em andamento
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Automação IA
          </CardTitle>
          <Bot className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{automationRate}%</div>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={automationRate} className="flex-1 h-2" />
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              {aiManagedConversations} de {totalConversations}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Conversas gerenciadas pela IA
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tempo de Resposta
          </CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">~{averageResponseTime}s</div>
          <p className="text-xs text-muted-foreground">
            Tempo médio da IA
          </p>
          <div className="flex items-center gap-1 mt-2">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-yellow-600">Resposta instantânea</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taxa de Sucesso
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={successRate} className="flex-1 h-2" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Resoluções automáticas bem-sucedidas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIStatusDashboard;