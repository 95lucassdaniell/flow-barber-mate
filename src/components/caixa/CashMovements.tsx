import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { useCashMovements } from '@/hooks/useCashMovements';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const CashMovements = () => {
  const { movements, loading } = useCashMovements();

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

  if (movements.length === 0) {
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
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma movimentação</h3>
            <p className="text-muted-foreground">
              Ainda não há movimentações de entrada ou saída para hoje.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Movimentações do Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {movements.map((movement) => (
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
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(movement.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {movement.created_by?.full_name || 'Sistema'}
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
                
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    movement.type === 'entry' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {movement.type === 'entry' ? '+' : '-'}R$ {movement.amount.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};