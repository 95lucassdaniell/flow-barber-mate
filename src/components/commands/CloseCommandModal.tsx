import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Banknote, 
  Smartphone,
  Receipt,
  DollarSign,
  Plus,
  ShoppingCart,
  Printer
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCommands } from "@/hooks/useCommands";
import { useToast } from "@/hooks/use-toast";
import { printReceipt } from "@/lib/printUtils";
import { ReceiptTemplate } from "./ReceiptTemplate";
import AddItemModal from "./AddItemModal";
import { useBarbershopSettings } from "@/hooks/useBarbershopSettings";

interface CloseCommandModalProps {
  command: any;
  isOpen: boolean;
  onClose: () => void;
}

const CloseCommandModal = ({ command, isOpen, onClose }: CloseCommandModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [currentCommand, setCurrentCommand] = useState(command);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const { closeCommand, refetchCommand } = useCommands();
  const { toast } = useToast();
  const { settings: barbershopSettings } = useBarbershopSettings();
  const [refreshing, setRefreshing] = useState(false);

  // Atualizar comando quando props mudarem
  useEffect(() => {
    setCurrentCommand(command);
  }, [command]);

  if (!command) return null;

  const subtotal = currentCommand?.total_amount || 0;
  const finalAmount = subtotal - discount;

  // Função para atualizar a comanda após adicionar itens
  const handleItemAdded = async () => {
    setRefreshing(true);
    setShowAddItemModal(false);
    
    try {
      // Recarregar especificamente esta comanda
      const updatedCommand = await refetchCommand(command.id);
      if (updatedCommand) {
        setCurrentCommand(updatedCommand);
      }
      
      toast({
        title: "Sucesso",
        description: "Item adicionado à comanda",
      });
    } catch (error) {
      console.error('Erro ao atualizar comanda:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar a comanda",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Função para imprimir cupom
  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      printReceipt(receiptRef.current);
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o cupom para impressão",
        variant: "destructive",
      });
    }
  };

  // Função para obter o label do método de pagamento
  const getPaymentMethodLabel = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method ? method.label : methodId;
  };

  const handleClose = async () => {
    if (finalAmount < 0) {
      toast({
        title: "Erro",
        description: "O desconto não pode ser maior que o valor total",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const success = await closeCommand(command.id, paymentMethod, discount, notes);
      if (success) {
        onClose();
        // Reset form
        setPaymentMethod("cash");
        setDiscount(0);
        setNotes("");
      }
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: "cash",
      label: "Dinheiro",
      icon: Banknote,
      description: "Pagamento em espécie"
    },
    {
      id: "card",
      label: "Cartão",
      icon: CreditCard,
      description: "Cartão de crédito/débito"
    },
    {
      id: "pix",
      label: "PIX",
      icon: Smartphone,
      description: "Pagamento via PIX"
    },
    {
      id: "multiple",
      label: "Múltiplas formas",
      icon: DollarSign,
      description: "Combinação de formas de pagamento"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Receipt className="w-6 h-6" />
            Fechar Comanda #{command.command_number}
          </DialogTitle>
          <DialogDescription>
            Finalize a comanda e registre o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda - Itens da Comanda */}
          <div className="space-y-6">
            {/* Informações da Comanda */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Comanda #{command.command_number}
                  {refreshing && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium">{command.client?.name || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Barbeiro:</span>
                  <span className="font-medium">{command.barber?.full_name || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Total de Itens:</span>
                  <span className="font-medium">{currentCommand?.command_items?.length || 0} item(s)</span>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Itens */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Itens da Comanda</CardTitle>
              </CardHeader>
              <CardContent>
                {currentCommand?.command_items?.length > 0 ? (
                  <div className="space-y-3">
                    {currentCommand.command_items.map((item: any, index: number) => (
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
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum item na comanda
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddItemModal(true)}
                    className="flex items-center gap-2"
                    disabled={refreshing}
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Item
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handlePrintReceipt}
                    className="flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir Cupom
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Pagamento */}
          <div className="space-y-6">
            {/* Resumo Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto:</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-xl font-bold">
                  <span>Total a Pagar:</span>
                  <span className={finalAmount < 0 ? "text-red-600" : "text-green-600"}>
                    {formatCurrency(finalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Desconto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desconto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="discount">Valor do desconto (R$)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max={subtotal}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0,00"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Método de pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="grid grid-cols-1 gap-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div className="flex items-center gap-3 flex-1">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <Label htmlFor={method.id} className="font-medium cursor-pointer">
                                {method.label}
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {method.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre o pagamento (opcional)"
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleClose} 
            disabled={loading || finalAmount < 0 || refreshing}
            className="flex-1"
          >
            {loading ? "Finalizando..." : refreshing ? "Atualizando..." : "Finalizar Comanda"}
          </Button>
        </div>

        {/* Template do cupom (oculto, apenas para impressão) */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={receiptRef}>
            <ReceiptTemplate
              command={currentCommand}
              barbershop={barbershopSettings}
              paymentMethod={getPaymentMethodLabel(paymentMethod)}
              discount={discount}
              notes={notes}
            />
          </div>
        </div>

        {/* Modal para adicionar itens */}
        <AddItemModal
          command={currentCommand}
          isOpen={showAddItemModal}
          onClose={() => setShowAddItemModal(false)}
          onItemAdded={handleItemAdded}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CloseCommandModal;