import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  User,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CashMovementItem } from "@/hooks/useCashMovements";

interface MovementDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: CashMovementItem | null;
}

export const MovementDetailsModal = ({ 
  open, 
  onOpenChange, 
  movement 
}: MovementDetailsModalProps) => {
  if (!movement) return null;

  const getSourceIcon = () => {
    switch (movement.source) {
      case 'manual':
        return <FileText className="h-4 w-4" />;
      case 'sale':
        return <ShoppingCart className="h-4 w-4" />;
      case 'command':
        return <Receipt className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSourceLabel = () => {
    switch (movement.source) {
      case 'manual':
        return 'Movimentação Manual';
      case 'sale':
        return 'Venda';
      case 'command':
        return 'Comanda';
      default:
        return 'Movimentação';
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const config = {
      cash: { label: 'Dinheiro', variant: 'default' as const },
      card: { label: 'Cartão', variant: 'secondary' as const },
      pix: { label: 'PIX', variant: 'outline' as const },
      multiple: { label: 'Múltiplas formas', variant: 'secondary' as const }
    };
    
    const methodConfig = config[method as keyof typeof config] || { label: method, variant: 'default' as const };
    
    return (
      <Badge variant={methodConfig.variant}>
        <CreditCard className="h-3 w-3 mr-1" />
        {methodConfig.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSourceIcon()}
            Detalhes da Movimentação
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Cabeçalho da movimentação */}
          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
            <div className="flex items-center gap-3">
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
              
              <div>
                <h3 className="font-semibold">{movement.description}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={movement.type === 'entry' ? 'default' : 'destructive'}>
                    {movement.type === 'entry' ? 'Entrada' : 'Saída'}
                  </Badge>
                  <Badge variant="outline">
                    {getSourceLabel()}
                  </Badge>
                </div>
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

          <Separator />

          {/* Informações gerais */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Data/Hora:</span>
              <span>{format(new Date(movement.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>

            {movement.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <span className="font-medium">Observações:</span>
                  <p className="text-muted-foreground mt-1">{movement.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Detalhes específicos por tipo */}
          {movement.source === 'sale' && movement.source_data && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Detalhes da Venda</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Método de Pagamento:</span>
                    {getPaymentMethodBadge(movement.source_data.payment_method)}
                  </div>
                  
                  {movement.source_data.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Valor Total:</span>
                      <span>R$ {movement.source_data.total_amount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {movement.source_data.discount_amount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Desconto:</span>
                      <span>- R$ {movement.source_data.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold">
                    <span>Valor Final:</span>
                    <span>R$ {movement.source_data.final_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {movement.source === 'manual' && movement.source_data?.profiles && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Registrado por:</span>
                <span>{movement.source_data.profiles.full_name}</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};