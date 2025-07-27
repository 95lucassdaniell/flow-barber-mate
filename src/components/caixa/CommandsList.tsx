import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Clock, 
  DollarSign, 
  User, 
  Scissors, 
  Receipt,
  FileText,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  BarChart3,
  Download,
  RefreshCw,
  Grid,
  List
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCashRegister } from "@/hooks/useCashRegister";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface Command {
  id: string;
  command_number: number;
  status: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  notes: string;
  closed_at: string;
  created_at: string;
  clients: { name: string };
  profiles: { full_name: string };
  command_items: Array<{
    id: string;
    item_type: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    service?: { name: string };
    product?: { name: string };
  }>;
}

interface CommandFilters {
  search: string;
  period: 'today' | 'yesterday' | 'week' | 'custom';
  professional: string;
  paymentMethod: string;
  sortBy: 'date' | 'value' | 'number';
  sortOrder: 'asc' | 'desc';
}

interface CommandStats {
  totalCommands: number;
  totalRevenue: number;
  averageValue: number;
  paymentMethods: Record<string, { count: number; total: number }>;
  professionalStats: Record<string, { count: number; total: number }>;
}

interface CommandsListProps {
  inModal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CommandsListContent = () => {
  const { currentCashRegister } = useCashRegister();
  const [commands, setCommands] = useState<Command[]>([]);
  const [allCommands, setAllCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<CommandFilters>({
    search: '',
    period: 'today',
    professional: '',
    paymentMethod: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSessionCommands = async () => {
    if (!currentCashRegister) return;

    try {
      setLoading(true);
      
      // Buscar comandas fechadas da sessão atual com range expandido para permitir filtros
      let query = supabase
        .from('commands')
        .select(`
          *,
          clients(name),
          profiles!commands_barber_id_fkey(full_name),
          command_items(
            id,
            item_type,
            quantity,
            unit_price,
            total_price,
            services(name),
            products(name)
          )
        `)
        .eq('status', 'closed')
        .eq('barbershop_id', currentCashRegister.barbershop_id);

      // Aplicar filtro de período mais amplo se necessário
      if (filters.period === 'today') {
        query = query.gte('closed_at', startOfDay(new Date()).toISOString());
      } else if (filters.period === 'yesterday') {
        const yesterday = subDays(new Date(), 1);
        query = query
          .gte('closed_at', startOfDay(yesterday).toISOString())
          .lte('closed_at', endOfDay(yesterday).toISOString());
      } else if (filters.period === 'week') {
        query = query.gte('closed_at', startOfDay(subDays(new Date(), 7)).toISOString());
      } else {
        // Para sessão atual
        query = query.gte('closed_at', currentCashRegister.opened_at);
      }

      const { data, error } = await query.order('closed_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar comandas da sessão:', error);
        return;
      }

      setAllCommands(data || []);
      setCommands(data || []);
    } catch (error) {
      console.error('Erro ao buscar comandas da sessão:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar e ordenar comandas
  const filteredCommands = useMemo(() => {
    let filtered = [...allCommands];

    // Aplicar busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(command => 
        command.command_number.toString().includes(filters.search) ||
        command.clients?.name.toLowerCase().includes(searchLower) ||
        command.profiles?.full_name.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por profissional
    if (filters.professional) {
      filtered = filtered.filter(command => 
        command.profiles?.full_name === filters.professional
      );
    }

    // Filtrar por método de pagamento
    if (filters.paymentMethod) {
      filtered = filtered.filter(command => 
        command.payment_method === filters.paymentMethod
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.closed_at).getTime() - new Date(b.closed_at).getTime();
          break;
        case 'value':
          comparison = a.total_amount - b.total_amount;
          break;
        case 'number':
          comparison = a.command_number - b.command_number;
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [allCommands, filters]);

  // Paginação
  const paginatedCommands = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCommands.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCommands, currentPage]);

  const totalPages = Math.ceil(filteredCommands.length / itemsPerPage);

  // Estatísticas
  const stats = useMemo((): CommandStats => {
    const totalCommands = filteredCommands.length;
    const totalRevenue = filteredCommands.reduce((sum, cmd) => sum + cmd.total_amount, 0);
    const averageValue = totalCommands > 0 ? totalRevenue / totalCommands : 0;

    const paymentMethods: Record<string, { count: number; total: number }> = {};
    const professionalStats: Record<string, { count: number; total: number }> = {};

    filteredCommands.forEach(command => {
      // Métodos de pagamento
      const method = command.payment_method || 'outros';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, total: 0 };
      }
      paymentMethods[method].count++;
      paymentMethods[method].total += command.total_amount;

      // Profissionais
      const professional = command.profiles?.full_name || 'N/A';
      if (!professionalStats[professional]) {
        professionalStats[professional] = { count: 0, total: 0 };
      }
      professionalStats[professional].count++;
      professionalStats[professional].total += command.total_amount;
    });

    return {
      totalCommands,
      totalRevenue,
      averageValue,
      paymentMethods,
      professionalStats
    };
  }, [filteredCommands]);

  // Listas únicas para filtros
  const professionals = useMemo(() => {
    const unique = new Set(allCommands.map(cmd => cmd.profiles?.full_name).filter(Boolean));
    return Array.from(unique);
  }, [allCommands]);

  const paymentMethods = useMemo(() => {
    const unique = new Set(allCommands.map(cmd => cmd.payment_method).filter(Boolean));
    return Array.from(unique);
  }, [allCommands]);

  useEffect(() => {
    if (currentCashRegister) {
      fetchSessionCommands();
    }
  }, [currentCashRegister, filters.period]);

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      cash: 'default',
      card: 'secondary', 
      pix: 'outline',
      multiple: 'destructive'
    } as const;

    const labels = {
      cash: 'Dinheiro',
      card: 'Cartão',
      pix: 'PIX',
      multiple: 'Misto'
    };

    return (
      <Badge variant={variants[method as keyof typeof variants] || 'default'}>
        {labels[method as keyof typeof labels] || method}
      </Badge>
    );
  };

  // Funções auxiliares
  const handleFilterChange = (key: keyof CommandFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchSessionCommands();
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando comandas...
      </div>
    );
  }

  if (filteredCommands.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        {/* Filtros sempre visíveis */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, cliente ou profissional..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.period} onValueChange={(value) => handleFilterChange('period', value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="custom">Sessão atual</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="text-center py-8 text-muted-foreground">
          <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Nenhuma comanda encontrada</p>
          <p className="text-sm">Ajuste os filtros ou verifique o período selecionado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente ou profissional..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>
          
          <Select value={filters.period} onValueChange={(value) => handleFilterChange('period', value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="custom">Sessão atual</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.professional || "all"} onValueChange={(value) => handleFilterChange('professional', value === "all" ? "" : value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos profissionais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos profissionais</SelectItem>
              {professionals.map(prof => (
                <SelectItem key={prof} value={prof}>{prof}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.paymentMethod || "all"} onValueChange={(value) => handleFilterChange('paymentMethod', value === "all" ? "" : value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos pagamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos pagamentos</SelectItem>
              {paymentMethods.map(method => (
                <SelectItem key={method} value={method}>
                  {method === 'cash' ? 'Dinheiro' : 
                   method === 'card' ? 'Cartão' :
                   method === 'pix' ? 'PIX' :
                   method === 'multiple' ? 'Misto' : method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-') as [CommandFilters['sortBy'], 'asc' | 'desc'];
              setFilters(prev => ({ ...prev, sortBy, sortOrder }));
            }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Mais recentes</SelectItem>
                <SelectItem value="date-asc">Mais antigas</SelectItem>
                <SelectItem value="value-desc">Maior valor</SelectItem>
                <SelectItem value="value-asc">Menor valor</SelectItem>
                <SelectItem value="number-desc">Número decrescente</SelectItem>
                <SelectItem value="number-asc">Número crescente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          <TabsTrigger value="professionals">Profissionais</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.totalCommands}
                  </div>
                  <div className="text-sm text-muted-foreground">Comandas</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(stats.averageValue)}
                  </div>
                  <div className="text-sm text-muted-foreground">Ticket Médio</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="payment" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.paymentMethods).map(([method, data]) => (
              <Card key={method}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {formatCurrency(data.total)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {method === 'cash' ? 'Dinheiro' : 
                       method === 'card' ? 'Cartão' :
                       method === 'pix' ? 'PIX' :
                       method === 'multiple' ? 'Misto' : method}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {data.count} comandas
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="professionals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(stats.professionalStats).map(([professional, data]) => (
              <Card key={professional}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{professional}</div>
                      <div className="text-sm text-muted-foreground">
                        {data.count} comandas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatCurrency(data.total)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Média: {formatCurrency(data.total / data.count)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Lista de comandas */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
        {paginatedCommands.map((command) => (
          <Card key={command.id} className="hover:shadow-md transition-shadow">
            <CardContent className={viewMode === 'grid' ? "p-4" : "p-3"}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    #{command.command_number}
                  </Badge>
                  {command.payment_method && getPaymentMethodBadge(command.payment_method)}
                </div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(command.total_amount)}
                </div>
              </div>

              <div className={`space-y-2 text-sm ${viewMode === 'list' ? 'md:flex md:space-y-0 md:space-x-6' : ''}`}>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Cliente: {command.clients?.name || 'N/A'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-muted-foreground" />
                  <span>Profissional: {command.profiles?.full_name || 'N/A'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Fechada: {format(new Date(command.closed_at), "HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                  <span>Itens: {command.command_items?.length || 0}</span>
                </div>
              </div>

              {command.notes && (
                <div className="mt-3 p-2 bg-muted rounded text-sm">
                  <strong>Observações:</strong> {command.notes}
                </div>
              )}

              <div className="flex justify-end mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setSelectedCommand(command)}
                >
                  <Eye className="h-4 w-4" />
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCommands.length)} - {Math.min(currentPage * itemsPerPage, filteredCommands.length)} de {filteredCommands.length} comandas
      </div>

      {/* Modal de detalhes da comanda */}
      <Sheet open={!!selectedCommand} onOpenChange={() => setSelectedCommand(null)}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Comanda #{selectedCommand?.command_number}
            </SheetTitle>
          </SheetHeader>

          {selectedCommand && (
            <div className="mt-6 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Informações da Comanda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium">{selectedCommand.clients?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profissional:</span>
                    <span className="font-medium">{selectedCommand.profiles?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagamento:</span>
                    {selectedCommand.payment_method && getPaymentMethodBadge(selectedCommand.payment_method)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fechada em:</span>
                    <span className="font-medium">
                      {format(new Date(selectedCommand.closed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Itens da Comanda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedCommand.command_items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.service?.name || item.product?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity}x {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.total_price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(selectedCommand.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedCommand.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedCommand.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const CommandsList = ({ inModal = false, open, onOpenChange }: CommandsListProps) => {
  if (inModal && onOpenChange) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Comandas da Sessão
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CommandsListContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return <CommandsListContent />;
};