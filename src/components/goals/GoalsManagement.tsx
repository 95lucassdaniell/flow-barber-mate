import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Plus, Filter } from "lucide-react";
import { useGoalsManagement } from "@/hooks/useGoalsManagement";
import GoalCard from "./GoalCard";
import GoalModal from "./GoalModal";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GoalsManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const { goals, loading, createGoal, updateGoal, deleteGoal, toggleGoalStatus } = useGoalsManagement();

  const handleCreateGoal = async (goalData: any) => {
    const success = await createGoal(goalData);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleEditGoal = async (goalData: any) => {
    if (!selectedGoal) return;
    const success = await updateGoal(selectedGoal.id, goalData);
    if (success) {
      setIsModalOpen(false);
      setSelectedGoal(null);
    }
  };

  const openEditModal = (goal: any) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGoal(null);
  };

  const filteredGoals = goals.filter(goal => {
    const statusMatch = statusFilter === "all" || 
      (statusFilter === "active" && goal.is_active) ||
      (statusFilter === "inactive" && !goal.is_active) ||
      (statusFilter === "completed" && goal.current_value >= goal.target_value) ||
      (statusFilter === "in_progress" && goal.current_value < goal.target_value && goal.is_active);
    
    const typeMatch = typeFilter === "all" || goal.goal_type === typeFilter;
    
    return statusMatch && typeMatch;
  });

  const getGoalTypeLabel = (type: string) => {
    const types = {
      'service_quantity': 'Quantidade de Serviços',
      'service_value': 'Valor em Serviços',
      'product_quantity': 'Quantidade de Produtos',
      'product_value': 'Valor em Produtos',
      'specific_service': 'Serviço Específico',
      'specific_product': 'Produto Específico'
    };
    return types[type] || type;
  };

  const stats = {
    total: goals.length,
    active: goals.filter(g => g.is_active).length,
    completed: goals.filter(g => g.current_value >= g.target_value).length,
    in_progress: goals.filter(g => g.current_value < g.target_value && g.is_active).length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Gestão de Metas</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Gestão de Metas</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Meta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Metas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Badge variant="secondary">{stats.total}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Metas Ativas</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Badge variant="default">{stats.active}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-600">{stats.completed}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
              </div>
              <Badge variant="outline" className="border-blue-500 text-blue-600">{stats.in_progress}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de Meta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="service_quantity">Quantidade de Serviços</SelectItem>
                  <SelectItem value="service_value">Valor em Serviços</SelectItem>
                  <SelectItem value="product_quantity">Quantidade de Produtos</SelectItem>
                  <SelectItem value="product_value">Valor em Produtos</SelectItem>
                  <SelectItem value="specific_service">Serviço Específico</SelectItem>
                  <SelectItem value="specific_product">Produto Específico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma meta encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {goals.length === 0 
                ? "Comece criando metas para motivar seus prestadores de serviço."
                : "Ajuste os filtros para ver outras metas ou crie uma nova meta."
              }
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Nova Meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => openEditModal(goal)}
              onDelete={() => deleteGoal(goal.id)}
              onToggleStatus={(isActive) => toggleGoalStatus(goal.id, isActive)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <GoalModal
        open={isModalOpen}
        onClose={closeModal}
        onSubmit={selectedGoal ? handleEditGoal : handleCreateGoal}
        initialData={selectedGoal}
      />
    </div>
  );
};

export default GoalsManagement;