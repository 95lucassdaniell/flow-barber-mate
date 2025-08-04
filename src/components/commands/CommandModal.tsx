import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Trash2, 
  Package, 
  Scissors,
  Receipt,
  RefreshCw,
  Crown,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCommands } from "@/hooks/useCommands";
import { useSubscriptionValidation } from "@/hooks/useSubscriptionValidation";
import AddItemModal from "./AddItemModal";

interface CommandModalProps {
  command: any;
  isOpen: boolean;
  onClose: () => void;
}

const CommandModal = ({ command, isOpen, onClose }: CommandModalProps) => {
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionSummary, setSubscriptionSummary] = useState<any>(null);
  const { removeItemFromCommand, refetchCommand } = useCommands();
  const { getSubscriptionSummary } = useSubscriptionValidation();

  if (!command) return null;

  useEffect(() => {
    const loadSubscriptionSummary = async () => {
      if (command.client_id && command.barber_id) {
        const summary = await getSubscriptionSummary(command.client_id, command.barber_id);
        setSubscriptionSummary(summary);
      }
    };
    
    if (isOpen) {
      loadSubscriptionSummary();
    }
  }, [command, isOpen, getSubscriptionSummary]);

  const handleRemoveItem = async (itemId: string) => {
    await removeItemFromCommand(itemId, command.id);
  };

  const handleItemAdded = async () => {
    setRefreshing(true);
    await refetchCommand(command.id);
    // Recarregar resumo da assinatura também
    if (command.client_id && command.barber_id) {
      const summary = await getSubscriptionSummary(command.client_id, command.barber_id);
      setSubscriptionSummary(summary);
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  const totalItems = command.command_items?.length || 0;
  const freeItems = command.command_items?.filter((item: any) => item.unit_price === 0) || [];
  const paidItems = command.command_items?.filter((item: any) => item.unit_price > 0) || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Receipt className="w-6 h-6" />
              Comanda #{command.command_number}
            </DialogTitle>
            <DialogDescription>
              Visualize e gerencie os itens da comanda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações da comanda */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Comanda</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{command.client?.name}</p>
                  <p className="text-sm text-muted-foreground">{command.client?.phone}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Barbeiro</p>
                  <p className="font-medium">{command.barber?.full_name}</p>
                </div>

                {command.appointment && (
                  <div>
                    <p className="text-sm text-muted-foreground">Agendamento</p>
                    <p className="font-medium">
                      {format(new Date(command.appointment.appointment_date), 'dd/MM/yyyy', { locale: ptBR })} às {command.appointment.start_time}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={command.status === 'open' ? 'default' : 'secondary'}>
                    {command.status === 'open' ? 'Aberta' : 'Fechada'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Criada em</p>
                  <p className="font-medium">
                    {format(new Date(command.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>

                {command.closed_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fechada em</p>
                    <p className="font-medium">
                      {format(new Date(command.closed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status da Assinatura */}
            {subscriptionSummary && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    Assinatura Ativa
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plano</p>
                    <p className="font-medium">{subscriptionSummary.plan_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Serviços Restantes</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-lg">{subscriptionSummary.remaining_services}</p>
                      {subscriptionSummary.remaining_services <= 2 && (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Válida até</p>
                    <p className="font-medium">
                      {format(new Date(subscriptionSummary.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Itens da comanda */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Itens da Comanda ({totalItems})
                    {refreshing && (
                      <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </CardTitle>
                  {command.status === 'open' && (
                    <Button 
                      onClick={() => setAddItemModalOpen(true)}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Item
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {totalItems === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum item adicionado</h3>
                    <p className="text-muted-foreground mb-4">
                      Adicione serviços ou produtos à comanda
                    </p>
                    {command.status === 'open' && (
                      <Button onClick={() => setAddItemModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeiro Item
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Itens gratuitos via assinatura */}
                    {freeItems.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Crown className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-600">Via Assinatura (Gratuito)</span>
                        </div>
                        <div className="space-y-2">
                          {freeItems.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-3 border border-purple-200 bg-purple-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Scissors className="w-5 h-5 text-purple-600" />
                                <div>
                                  <p className="font-medium">
                                    {item.service?.name || item.product?.name}
                                  </p>
                                  <p className="text-sm text-purple-600">
                                    Serviço gratuito via assinatura
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-medium text-purple-600">GRATUITO</p>
                                  <p className="text-sm text-muted-foreground">
                                    Comissão: {item.commission_rate}%
                                  </p>
                                </div>
                                
                                {command.status === 'open' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Itens pagos */}
                    {paidItems.length > 0 && (
                      <div>
                        {freeItems.length > 0 && (
                          <div className="flex items-center gap-2 mb-3 mt-4">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">Itens Cobrados</span>
                          </div>
                        )}
                        <div className="space-y-2">
                          {paidItems.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                {item.item_type === 'service' ? (
                                  <Scissors className="w-5 h-5 text-blue-500" />
                                ) : (
                                  <Package className="w-5 h-5 text-green-500" />
                                )}
                                <div>
                                  <p className="font-medium">
                                    {item.service?.name || item.product?.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.quantity}x {formatCurrency(item.unit_price)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-medium">{formatCurrency(item.total_price)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Comissão: {item.commission_rate}%
                                  </p>
                                </div>
                                
                                {command.status === 'open' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  {freeItems.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-600">Economia via assinatura:</span>
                      <span className="text-purple-600 font-medium">
                        {formatCurrency(freeItems.reduce((sum: number, item: any) => sum + (item.quantity * 50), 0))}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total da Comanda:</span>
                    <span>{formatCurrency(command.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <AddItemModal
        command={command}
        isOpen={addItemModalOpen}
        onClose={() => setAddItemModalOpen(false)}
        onItemAdded={handleItemAdded}
      />
    </>
  );
};

export default CommandModal;