import { Clock, DollarSign, ShoppingCart, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCashRegister } from "@/hooks/useCashRegister";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashRegisterStatusProps {
  onViewHistory: () => void;
  onCloseCash: () => void;
  onOpenCash: () => void;
}

export const CashRegisterStatus = ({ onViewHistory, onCloseCash, onOpenCash }: CashRegisterStatusProps) => {
  const { currentCashRegister, getCashRegisterSummary } = useCashRegister();
  
  if (!currentCashRegister) {
    return (
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Caixa Fechado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 mb-4">
            O caixa precisa ser aberto antes de realizar vendas.
          </p>
          <Button onClick={onOpenCash} className="w-full">
            Abrir Caixa
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summary = getCashRegisterSummary();
  const openedAt = new Date(currentCashRegister.opened_at);

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              <div className="w-2 h-2 bg-white rounded-full mr-2" />
              Caixa Aberto
            </Badge>
            <div className="text-sm text-muted-foreground">
              <Clock className="w-4 h-4 inline mr-1" />
              Aberto em {format(openedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onViewHistory}
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Histórico
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={onCloseCash}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Fechar Caixa
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {summary.salesCount}
            </div>
            <div className="text-sm text-muted-foreground">Vendas</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              R$ {summary.totalRevenue.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              R$ {currentCashRegister.opening_balance.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Valor Inicial</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-semibold">Dinheiro</div>
            <div>R$ {summary.salesByPaymentMethod.cash.toFixed(2)}</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-semibold">Cartão</div>
            <div>R$ {summary.salesByPaymentMethod.card.toFixed(2)}</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-semibold">PIX</div>
            <div>R$ {summary.salesByPaymentMethod.pix.toFixed(2)}</div>
          </div>
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="font-semibold">Misto</div>
            <div>R$ {summary.salesByPaymentMethod.multiple.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};