import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSubscriptionBilling } from "@/hooks/useSubscriptionBilling";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Calendar, User, FileText, DollarSign } from "lucide-react";

interface BillingDetailModalProps {
  billingId: string;
  open: boolean;
  onClose: () => void;
}

export default function BillingDetailModal({ billingId, open, onClose }: BillingDetailModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { billings, updateBillingStatus, addNotes } = useSubscriptionBilling();
  
  const billing = billings.find(b => b.id === billingId);

  useEffect(() => {
    if (billing) {
      setPaymentMethod(billing.payment_method || "");
      setNotes(billing.notes || "");
    }
  }, [billing]);

  if (!billing) return null;

  const handleMarkAsPaid = async () => {
    setIsUpdating(true);
    try {
      await updateBillingStatus(billingId, 'paid', paymentMethod, notes);
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsPending = async () => {
    setIsUpdating(true);
    try {
      await updateBillingStatus(billingId, 'pending', undefined, notes);
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsUpdating(true);
    try {
      await addNotes(billingId, notes);
    } finally {
      setIsUpdating(false);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Cobrança</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações da Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{billing.client_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Prestador</Label>
                  <p className="font-medium">{billing.provider_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Plano</Label>
                  <p className="font-medium">{billing.plan_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(billing.status, billing.due_date)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Valores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Valor Total</Label>
                  <p className="text-lg font-semibold">{formatCurrency(billing.amount)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Comissão</Label>
                  <p className="text-lg font-semibold text-orange-600">{formatCurrency(billing.commission_amount)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Valor Líquido</Label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(billing.net_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações de Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Data de Vencimento</Label>
                  <p className="font-medium">
                    {format(new Date(billing.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                {billing.payment_date && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Data de Pagamento</Label>
                    <p className="font-medium">
                      {format(new Date(billing.payment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Pagamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Informações de Pagamento
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="payment-method">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta cobrança..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={handleSaveNotes}
              disabled={isUpdating}
            >
              Salvar Observações
            </Button>

            <div className="flex space-x-2">
              {billing.status === 'paid' && (
                <Button 
                  variant="outline" 
                  onClick={handleMarkAsPending}
                  disabled={isUpdating}
                >
                  Marcar como Pendente
                </Button>
              )}
              
              {billing.status === 'pending' && (
                <Button 
                  onClick={handleMarkAsPaid}
                  disabled={isUpdating || !paymentMethod}
                >
                  {isUpdating ? "Atualizando..." : "Marcar como Pago"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}