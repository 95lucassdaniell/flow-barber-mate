import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubscriptionBilling } from "@/hooks/useSubscriptionBilling";
import { useProviders } from "@/hooks/useProviders";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Eye, FileText, Calendar, User } from "lucide-react";
import BillingDetailModal from "./BillingDetailModal";

interface BillingFilters {
  status: string;
  startDate: string;
  endDate: string;
  providerId: string;
}

export default function SubscriptionBillingList() {
  const [filters, setFilters] = useState<BillingFilters>({
    status: 'all',
    startDate: '',
    endDate: '',
    providerId: 'all'
  });
  
  const [selectedBilling, setSelectedBilling] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  console.group('🔍 [SubscriptionBillingList] Component render');
  console.log('Current filters:', filters);
  
  const hookFilters = {
    status: filters.status === 'all' ? undefined : filters.status,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    providerId: filters.providerId === 'all' ? undefined : filters.providerId
  };
  console.log('Processed filters for hook:', hookFilters);

  const { billings, loading, updateBillingStatus } = useSubscriptionBilling(hookFilters);
  const { providers } = useProviders();
  
  console.log('Component state:', {
    billingsCount: billings?.length || 0,
    loading,
    providersCount: providers?.length || 0
  });
  console.log('Raw billings data:', billings);
  console.groupEnd();

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    if (status === 'paid') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Pago</Badge>;
    }
    
    if (status === 'pending' && due < today) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const handleQuickPay = async (billingId: string) => {
    await updateBillingStatus(billingId, 'paid', 'Dinheiro');
  };

  const openDetailModal = (billingId: string) => {
    setSelectedBilling(billingId);
    setShowDetailModal(true);
  };

  const pendingCount = billings.filter(b => b.status === 'pending').length;
  const overdueCount = billings.filter(b => {
    return b.status === 'pending' && new Date(b.due_date) < new Date();
  }).length;
  const totalPending = billings
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Pendente</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Prestador</label>
              <Select value={filters.providerId} onValueChange={(value) => setFilters(prev => ({ ...prev, providerId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os prestadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cobranças */}
      <Card>
        <CardHeader>
          <CardTitle>Cobranças de Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          {billings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Prestador</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billings.map((billing) => (
                  <TableRow key={billing.id}>
                    <TableCell className="font-medium">{billing.client_name}</TableCell>
                    <TableCell>{billing.provider_name}</TableCell>
                    <TableCell>{billing.plan_name}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(billing.amount)}</TableCell>
                    <TableCell>
                      {format(new Date(billing.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(billing.status, billing.due_date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailModal(billing.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {billing.status === 'pending' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleQuickPay(billing.id)}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma cobrança encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {selectedBilling && (
        <BillingDetailModal
          billingId={selectedBilling}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBilling(null);
          }}
        />
      )}
    </div>
  );
}