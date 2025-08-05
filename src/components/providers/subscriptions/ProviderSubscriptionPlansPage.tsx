import { Eye, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProviderSubscriptionPlans } from "@/hooks/useProviderSubscriptionPlans";
import { useProviderServices } from "@/hooks/useProviderServices";
import { formatCurrency } from "@/lib/utils";

export default function ProviderSubscriptionPlansPage() {
  const { plans, loading } = useProviderSubscriptionPlans();
  const { allServices } = useProviderServices();

  const getServiceNames = (serviceIds: string[] | null) => {
    if (!serviceIds || !allServices) return "Nenhum serviço";
    return serviceIds
      .map(id => allServices.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meus Planos de Assinatura</h1>
        <p className="text-muted-foreground">
          Visualize os planos de assinatura criados para você pelos administradores
        </p>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum plano criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Os administradores ainda não criaram planos para você
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const commissionAmount = (plan.monthly_price * plan.commission_percentage) / 100;
            const netAmount = plan.monthly_price - commissionAmount;

            return (
              <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {formatCurrency(plan.monthly_price)}
                    </div>
                    <div className="text-sm text-muted-foreground">por mês</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Serviços inclusos:</span>
                      <Badge variant="outline">{plan.included_services_count}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sua comissão:</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(commissionAmount)} ({plan.commission_percentage}%)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Para a barbearia:</span>
                      <span className="text-sm">
                        {formatCurrency(netAmount)}
                      </span>
                    </div>
                  </div>

                  {plan.enabled_service_ids && plan.enabled_service_ids.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Serviços habilitados:</p>
                      <p className="text-xs text-muted-foreground">
                        {getServiceNames(plan.enabled_service_ids)}
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
}