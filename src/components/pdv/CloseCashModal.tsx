import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Calculator, TrendingUp, Clock } from "lucide-react";
import { useCashRegister } from "@/hooks/useCashRegister";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CloseCashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (closingBalance: number, notes?: string) => Promise<boolean>;
}

export const CloseCashModal = ({ open, onOpenChange, onConfirm }: CloseCashModalProps) => {
  const { currentCashRegister, getCashRegisterSummary } = useCashRegister();
  const [closingBalance, setClosingBalance] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!currentCashRegister) return null;

  const summary = getCashRegisterSummary();
  const openedAt = new Date(currentCashRegister.opened_at);
  const now = new Date();
  const sessionDuration = Math.floor((now.getTime() - openedAt.getTime()) / (1000 * 60 * 60));

  const expectedBalance = currentCashRegister.opening_balance + summary.salesByPaymentMethod.cash;
  const difference = closingBalance ? parseFloat(closingBalance) - expectedBalance : 0;

  const handleCloseCash = async () => {
    if (!closingBalance) return;

    try {
      setLoading(true);
      const success = await onConfirm(parseFloat(closingBalance), notes);
      
      if (success) {
        onOpenChange(false);
        setClosingBalance("");
        setNotes("");
      }
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="w-6 h-6" />
            Fechamento de Caixa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da sessão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Informações da Sessão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Abertura</Label>
                  <div className="text-sm text-muted-foreground">
                    {format(openedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Duração</Label>
                  <div className="text-sm text-muted-foreground">
                    {sessionDuration}h {Math.floor(((now.getTime() - openedAt.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}min
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {summary.salesCount}
                    </div>
                    <div className="text-sm text-blue-600">Vendas Realizadas</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {summary.totalRevenue.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">Receita Total</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Formas de Pagamento</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">Dinheiro:</span>
                      <span>R$ {summary.salesByPaymentMethod.cash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">Cartão:</span>
                      <span>R$ {summary.salesByPaymentMethod.card.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">PIX:</span>
                      <span>R$ {summary.salesByPaymentMethod.pix.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                      <span className="font-medium">Misto:</span>
                      <span>R$ {summary.salesByPaymentMethod.multiple.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Valor inicial do caixa:</span>
                    <span className="font-medium">R$ {currentCashRegister.opening_balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dinheiro em vendas:</span>
                    <span className="font-medium">R$ {summary.salesByPaymentMethod.cash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Valor esperado no caixa:</span>
                    <span className="text-green-600">R$ {expectedBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conferência de caixa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Conferência de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="closing-balance">
                  Valor contado no caixa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="closing-balance"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>

              {closingBalance && (
                <div className={`p-3 rounded-lg ${
                  Math.abs(difference) < 0.01 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Diferença:</span>
                    <span className={`text-lg font-bold ${
                      Math.abs(difference) < 0.01 
                        ? 'text-green-600' 
                        : difference > 0 
                          ? 'text-blue-600' 
                          : 'text-red-600'
                    }`}>
                      {difference > 0 ? '+' : ''}R$ {difference.toFixed(2)}
                    </span>
                  </div>
                  {Math.abs(difference) >= 0.01 && (
                    <div className="text-sm mt-1">
                      {difference > 0 ? 'Sobra no caixa' : 'Falta no caixa'}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações sobre o fechamento do caixa..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCloseCash}
              disabled={!closingBalance || loading}
              className="min-w-[120px]"
            >
              {loading ? "Fechando..." : "Fechar Caixa"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};