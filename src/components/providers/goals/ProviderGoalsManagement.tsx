import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProviderGoals } from '@/hooks/useProviderGoals';
import { Plus, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const ProviderGoalsManagement = () => {
  const { goals, loading } = useProviderGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getGoalTypeLabel = (goalType: string) => {
    const labels = {
      'service_quantity': 'Quantidade de Serviços',
      'service_value': 'Valor em Serviços',
      'product_quantity': 'Quantidade de Produtos', 
      'product_value': 'Valor em Produtos',
      'specific_service': 'Serviço Específico',
      'specific_product': 'Produto Específico'
    };
    return labels[goalType as keyof typeof labels] || goalType;
  };

  const getProgress = (goal: any) => {
    return goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Target className="w-8 h-8" />
          Minhas Metas
        </h1>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma meta definida</h3>
            <p className="text-muted-foreground">
              Suas metas serão definidas pelo administrador da barbearia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = getProgress(goal);
            const isCompleted = progress >= 100;
            const isNearCompletion = progress >= 80;

            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{getGoalTypeLabel(goal.goal_type)}</CardTitle>
                      {goal.specific_service?.name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Serviço: {goal.specific_service.name}
                        </p>
                      )}
                      {goal.specific_product?.name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Produto: {goal.specific_product.name}
                        </p>
                      )}
                    </div>
                    <Badge variant={isCompleted ? "default" : isNearCompletion ? "secondary" : "outline"}>
                      {isCompleted ? "Concluída" : isNearCompletion ? "Quase lá!" : "Em andamento"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span className="font-medium">
                      {goal.current_value.toLocaleString('pt-BR')} / {goal.target_value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-3" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {new Date(goal.period_start).toLocaleDateString('pt-BR')} até {new Date(goal.period_end).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-foreground'}`}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  {isCompleted && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">
                        🎉 Parabéns! Você atingiu esta meta!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProviderGoalsManagement;