import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  User,
  FileText,
  Eye,
  ShoppingCart,
  Receipt,
  Filter
} from 'lucide-react';
import { useCashMovements, CashMovementItem } from '@/hooks/useCashMovements';
import { MovementDetailsModal } from './MovementDetailsModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const CashMovements = () => {
  const { movements, loading } = useCashMovements();
  const [selectedMovement, setSelectedMovement] = useState<CashMovementItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'manual' | 'sale'>('all');

  const filteredMovements = movements.filter(movement => {
    if (filter === 'all') return true;
    return movement.source === filter;
  });

  const handleViewDetails = (movement: CashMovementItem) => {
    setSelectedMovement(movement);
    setDetailsModalOpen(true);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'manual':
        return <FileText className="h-3 w-3" />;
      case 'sale':
        return <ShoppingCart className="h-3 w-3" />;
      case 'command':
        return <Receipt className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'manual':
        return 'Manual';
      case 'sale':
        return 'Venda';
      case 'command':
        return 'Comanda';
      default:
        return 'Movimento';
    }
  };

  // Calcular estatísticas
  const stats = {
    totalEntries: filteredMovements.filter(m => m.type === 'entry').reduce((sum, m) => sum + m.amount, 0),
    totalExits: filteredMovements.filter(m => m.type === 'exit').reduce((sum, m) => sum + m.amount, 0),
    totalMovements: filteredMovements.length,
    salesCount: filteredMovements.filter(m => m.source === 'sale').length,
    manualCount: filteredMovements.filter(m => m.source === 'manual').length,
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Movimentações do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Carregando movimentações...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredMovements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Movimentações do Dia
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Badge variant="outline">{filter === 'all' ? 'Todas' : filter === 'manual' ? 'Manuais' : 'Vendas'}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma movimentação</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'Ainda não há movimentações para hoje.'
                : `Nenhuma movimentação do tipo "${filter === 'manual' ? 'manual' : 'venda'}" encontrada.`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Movimentações do Dia
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({movements.length})
              </Button>
              <Button
                variant={filter === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('manual')}
              >
                Manuais ({stats.manualCount})
              </Button>
              <Button
                variant={filter === 'sale' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('sale')}
              >
                Vendas ({stats.salesCount})
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Resumo de estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Total Entradas</div>
              <div className="text-lg font-bold text-green-700">R$ {stats.totalEntries.toFixed(2)}</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600 font-medium">Total Saídas</div>
              <div className="text-lg font-bold text-red-700">R$ {stats.totalExits.toFixed(2)}</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Saldo</div>
              <div className={`text-lg font-bold ${
                (stats.totalEntries - stats.totalExits) >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                R$ {(stats.totalEntries - stats.totalExits).toFixed(2)}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 font-medium">Movimentações</div>
              <div className="text-lg font-bold text-gray-700">{stats.totalMovements}</div>
            </div>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      movement.type === 'entry' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {movement.type === 'entry' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{movement.description}</span>
                        <Badge variant={movement.type === 'entry' ? 'default' : 'destructive'}>
                          {movement.type === 'entry' ? 'Entrada' : 'Saída'}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getSourceIcon(movement.source)}
                          {getSourceLabel(movement.source)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(movement.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      
                      {movement.notes && (
                        <div className="flex items-start gap-1 text-sm text-muted-foreground">
                          <FileText className="h-3 w-3 mt-0.5" />
                          <span>{movement.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(movement)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        movement.type === 'entry' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.type === 'entry' ? '+' : '-'}R$ {movement.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <MovementDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        movement={selectedMovement}
      />
    </>
  );
};