import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useAdminSubscriptionPlans } from "@/hooks/useAdminSubscriptionPlans";
import { useServices } from "@/hooks/useServices";
import { AdminSubscriptionPlanModal } from "./AdminSubscriptionPlanModal";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminSubscriptionPlansPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const { plans, loading, createPlan, updatePlan, togglePlanStatus, deletePlan } = useAdminSubscriptionPlans();
  const { services } = useServices();
  const { toast } = useToast();

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setIsModalOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deletePlan(planId);
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
    }
  };

  const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
    try {
      await togglePlanStatus(planId, !currentStatus);
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const getServiceNames = (serviceIds: string[] | null) => {
    if (!serviceIds || !services) return "Nenhum serviço";
    return serviceIds
      .map(id => services.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos de Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura para seus prestadores
          </p>
        </div>
        <Button onClick={handleCreatePlan}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Nenhum plano criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie o primeiro plano de assinatura para começar
              </p>
              <Button onClick={handleCreatePlan}>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro plano
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <CardDescription>
                  Prestador: {plan.provider?.full_name || "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preço mensal:</span>
                    <span className="font-medium">{formatCurrency(plan.monthly_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Serviços inclusos:</span>
                    <span className="font-medium">{plan.included_services_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Comissão:</span>
                    <span className="font-medium">{plan.commission_percentage}%</span>
                  </div>
                </div>

                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Serviços habilitados:</p>
                  <p className="text-xs text-muted-foreground">
                    {getServiceNames(plan.enabled_service_ids)}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1"
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(plan.id, plan.is_active)}
                  >
                    {plan.is_active ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir plano</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o plano "{plan.name}"?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePlan(plan.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AdminSubscriptionPlanModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        plan={selectedPlan}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedPlan(null);
        }}
      />
    </div>
  );
}