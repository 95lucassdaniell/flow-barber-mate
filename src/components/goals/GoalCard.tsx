import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Calendar,
  Target,
  TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Goal } from "@/hooks/useGoalsManagement";
import { formatCurrency } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: (isActive: boolean) => void;
}

const GoalCard = ({ goal, onEdit, onDelete, onToggleStatus }: GoalCardProps) => {
  const progress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
  const isCompleted = progress >= 100;
  const isExpired = new Date(goal.period_end) < new Date();

  const getGoalTypeLabel = (type: string) => {
    const types = {
      'service_quantity': 'Qtd. Serviços',
      'service_value': 'Valor Serviços',
      'product_quantity': 'Qtd. Produtos',
      'product_value': 'Valor Produtos',
      'specific_service': 'Serviço Específico',
      'specific_product': 'Produto Específico'
    };
    return types[type] || type;
  };

  const formatValue = (value: number, type: string) => {
    if (type.includes('value')) {
      return formatCurrency(value);
    }
    return value.toString();
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return <Badge className="bg-green-500 hover:bg-green-600">Concluída</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expirada</Badge>;
    }
    if (!goal.is_active) {
      return <Badge variant="secondary">Pausada</Badge>;
    }
    return <Badge variant="default">Em Andamento</Badge>;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="" />
              <AvatarFallback>
                {goal.provider_name?.charAt(0).toUpperCase() || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{goal.provider_name}</h3>
              <p className="text-xs text-muted-foreground">
                {getGoalTypeLabel(goal.goal_type)}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(!goal.is_active)}>
                {goal.is_active ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {getStatusBadge()}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Specific Service/Product Info */}
        {(goal.service_name || goal.product_name) && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {goal.service_name ? 'Serviço' : 'Produto'} Específico:
            </p>
            <p className="text-sm font-medium">
              {goal.service_name || goal.product_name}
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatValue(goal.current_value, goal.goal_type)}</span>
            <span>{formatValue(goal.target_value, goal.goal_type)}</span>
          </div>
        </div>

        {/* Goal Target */}
        <div className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-primary" />
          <span>Meta: {formatValue(goal.target_value, goal.goal_type)}</span>
        </div>

        {/* Period */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(goal.period_start).toLocaleDateString('pt-BR')} - {' '}
            {new Date(goal.period_end).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </CardContent>

      {/* Completion Message */}
      {isCompleted && (
        <CardFooter className="pt-0">
          <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Parabéns! Meta atingida!</span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default GoalCard;