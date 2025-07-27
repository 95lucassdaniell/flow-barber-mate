import { useState } from "react";
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
  Receipt
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCommands } from "@/hooks/useCommands";
import AddItemModal from "./AddItemModal";

interface CommandModalProps {
  command: any;
  isOpen: boolean;
  onClose: () => void;
}

const CommandModal = ({ command, isOpen, onClose }: CommandModalProps) => {
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const { removeItemFromCommand } = useCommands();

  if (!command) return null;

  const handleRemoveItem = async (itemId: string) => {
    await removeItemFromCommand(itemId, command.id);
  };

  const totalItems = command.command_items?.length || 0;

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

            {/* Itens da comanda */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Itens da Comanda ({totalItems})
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
                  <div className="space-y-3">
                    {command.command_items?.map((item: any) => (
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
                )}
              </CardContent>
            </Card>

            {/* Total */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total da Comanda:</span>
                  <span>{formatCurrency(command.total_amount)}</span>
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
      />
    </>
  );
};

export default CommandModal;