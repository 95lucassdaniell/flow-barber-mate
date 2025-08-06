import { useState, useMemo, useEffect } from "react";
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
import { useProviders } from "@/hooks/useProviders";
import { SubscriptionBilling } from "@/hooks/useIntelligentSubscriptionData";
import { formatCurrency } from "@/lib/utils";
import { debugLogger } from "@/lib/debugLogger";
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

interface SubscriptionBillingListProps {
  billings: SubscriptionBilling[];
  loading: boolean;
  fromCache?: boolean;
}

export default function SubscriptionBillingList({ 
  billings: propBillings, 
  loading: propLoading, 
  fromCache 
}: SubscriptionBillingListProps) {
  const [filters, setFilters] = useState<BillingFilters>({
    status: 'all',
    startDate: '',
    endDate: '',
    providerId: 'all'
  });
  
  const [selectedBilling, setSelectedBilling] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Memorizar os filtros processados para o hook
  const hookFilters = useMemo(() => ({
    status: filters.status === 'all' ? undefined : filters.status,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    providerId: filters.providerId === 'all' ? undefined : filters.providerId
  }), [filters.status, filters.startDate, filters.endDate, filters.providerId]);

  const { providers } = useProviders();
  
  // Filtrar billings localmente para performance
  const filteredBillings = useMemo(() => {
    return propBillings.filter(billing => {
      if (filters.status !== 'all') {
        if (filters.status === 'overdue') {
          return billing.status === 'pending' && new Date(billing.due_date) < new Date();
        }
        if (billing.status !== filters.status) return false;
      }
      
      if (filters.providerId !== 'all' && billing.provider_id !== filters.providerId) {
        return false;
      }
      
      if (filters.startDate && new Date(billing.due_date) < new Date(filters.startDate)) {
        return false;
      }
      
      if (filters.endDate && new Date(billing.due_date) > new Date(filters.endDate)) {
        return false;
      }
      
      return true;
    });
  }, [propBillings, filters]);

  // Logs movidos para useEffect para evitar execução a cada render
  useEffect(() => {
    debugLogger.billing.group('SubscriptionBillingList', 'Component updated', () => {
      debugLogger.billing.debug('SubscriptionBillingList', 'Current filters', filters);
      debugLogger.billing.debug('SubscriptionBillingList', 'Processed filters for hook', hookFilters);
      debugLogger.billing.debug('SubscriptionBillingList', 'Component state', {
        billingsCount: propBillings?.length || 0,
        loading: propLoading,
        providersCount: providers?.length || 0
      });
    });
  }, [filters, hookFilters, propBillings?.length, propLoading, providers?.length]);

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
    // TODO: Implementar updateBillingStatus no hook inteligente
    console.log('Marking as paid:', billingId);
  };

  const openDetailModal = (billingId: string) => {
    setSelectedBilling(billingId);
    setShowDetailModal(true);
  };

  const pendingCount = filteredBillings.filter(b => b.status === 'pending').length;
  const overdueCount = filteredBillings.filter(b => {
    return b.status === 'pending' && new Date(b.due_date) < new Date();
  }).length;
  const totalPending = filteredBillings
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);

  if (propLoading) {
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
          {fromCache && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              📊 Dados do cache - Carregamento instantâneo
            </div>
          )}
          {filteredBillings.length > 0 ? (
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
                {filteredBillings.map((billing) => (
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