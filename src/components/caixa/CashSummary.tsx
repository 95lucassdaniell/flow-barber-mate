import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Calculator
} from 'lucide-react';
import { useCashRegister } from '@/hooks/useCashRegister';
import { useCashMovements } from '@/hooks/useCashMovements';

export const CashSummary = () => {
  const { currentCashRegister, getCashRegisterSummary } = useCashRegister();
  const { getTodayMovements } = useCashMovements();
  
  if (!currentCashRegister) return null;

  const summary = getCashRegisterSummary();
  const todayMovements = getTodayMovements();
  
  const totalEntries = todayMovements
    .filter(m => m.type === 'entry')
    .reduce((sum, m) => sum + m.amount, 0);
    
  const totalExits = todayMovements
    .filter(m => m.type === 'exit')
    .reduce((sum, m) => sum + m.amount, 0);

  const currentBalance = currentCashRegister.opening_balance + 
                        summary.salesByPaymentMethod.cash + 
                        totalEntries - 
                        totalExits;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Saldo Atual
          </CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            R$ {currentBalance.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Valor disponível no caixa
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vendas do Dia
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {summary.totalRevenue.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.salesCount} vendas realizadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Entradas
          </CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {totalEntries.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Movimentações de entrada
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Saídas
          </CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            R$ {totalExits.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Movimentações de saída
          </p>
        </CardContent>
      </Card>
    </div>
  );
};