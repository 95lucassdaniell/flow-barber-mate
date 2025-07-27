import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Eye, 
  Clock, 
  DollarSign, 
  User, 
  Scissors, 
  Receipt,
  FileText 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCashRegister } from "@/hooks/useCashRegister";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface Command {
  id: string;
  command_number: number;
  status: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  notes: string;
  closed_at: string;
  created_at: string;
  clients: { name: string };
  profiles: { full_name: string };
  command_items: Array<{
    id: string;
    item_type: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    service?: { name: string };
    product?: { name: string };
  }>;
}

interface CommandsListProps {
  inModal?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CommandsListContent = () => {
  const { currentCashRegister } = useCashRegister();
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);

  const fetchSessionCommands = async () => {
    if (!currentCashRegister) return;

    try {
      setLoading(true);
      
      // Buscar comandas fechadas que correspondem às vendas da sessão atual
      const { data: salesData } = await supabase
        .from('sales')
        .select('barber_id, client_id, created_at')
        .eq('cash_register_id', currentCashRegister.id);

      if (!salesData || salesData.length === 0) {
        setCommands([]);
        return;
      }

      // Buscar comandas que correspondem às vendas (por barber_id, client_id e data próxima)
      const { data, error } = await supabase
        .from('commands')
        .select(`
          *,
          clients(name),
          profiles!commands_barber_id_fkey(full_name),
          command_items(
            id,
            item_type,
            quantity,
            unit_price,
            total_price,
            services(name),
            products(name)
          )
        `)
        .eq('status', 'closed')
        .eq('barbershop_id', currentCashRegister.barbershop_id)
        .gte('closed_at', currentCashRegister.opened_at)
        .order('closed_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar comandas da sessão:', error);
        return;
      }

      setCommands(data || []);
    } catch (error) {
      console.error('Erro ao buscar comandas da sessão:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCashRegister) {
      fetchSessionCommands();
    }
  }, [currentCashRegister]);

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      cash: 'default',
      card: 'secondary', 
      pix: 'outline',
      multiple: 'destructive'
    } as const;

    const labels = {
      cash: 'Dinheiro',
      card: 'Cartão',
      pix: 'PIX',
      multiple: 'Misto'
    };

    return (
      <Badge variant={variants[method as keyof typeof variants] || 'default'}>
        {labels[method as keyof typeof labels] || method}
      </Badge>
    );
  };

  const totalCommandsRevenue = commands.reduce((sum, command) => sum + command.total_amount, 0);

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando comandas...
      </div>
    );
  }

  if (commands.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>Nenhuma comanda fechada nesta sessão</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo das comandas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resumo das Comandas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {commands.length}
              </div>
              <div className="text-sm text-muted-foreground">Comandas Fechadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCommandsRevenue)}
              </div>
              <div className="text-sm text-muted-foreground">Total das Comandas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de comandas */}
      <div className="space-y-3">
        {commands.map((command) => (
          <Card key={command.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    #{command.command_number}
                  </Badge>
                  {command.payment_method && getPaymentMethodBadge(command.payment_method)}
                </div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(command.total_amount)}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Cliente: {command.clients?.name || 'N/A'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-muted-foreground" />
                  <span>Profissional: {command.profiles?.full_name || 'N/A'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Fechada: {format(new Date(command.closed_at), "HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                  <span>Itens: {command.command_items?.length || 0}</span>
                </div>
              </div>

              {command.notes && (
                <div className="mt-3 p-2 bg-muted rounded text-sm">
                  <strong>Observações:</strong> {command.notes}
                </div>
              )}

              <div className="flex justify-end mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setSelectedCommand(command)}
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de detalhes da comanda */}
      <Sheet open={!!selectedCommand} onOpenChange={() => setSelectedCommand(null)}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Comanda #{selectedCommand?.command_number}
            </SheetTitle>
          </SheetHeader>

          {selectedCommand && (
            <div className="mt-6 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Informações da Comanda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium">{selectedCommand.clients?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profissional:</span>
                    <span className="font-medium">{selectedCommand.profiles?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagamento:</span>
                    {selectedCommand.payment_method && getPaymentMethodBadge(selectedCommand.payment_method)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fechada em:</span>
                    <span className="font-medium">
                      {format(new Date(selectedCommand.closed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Itens da Comanda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedCommand.command_items?.map((item, index) => (
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
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(selectedCommand.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedCommand.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedCommand.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const CommandsList = ({ inModal = false, open, onOpenChange }: CommandsListProps) => {
  if (inModal && onOpenChange) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Comandas da Sessão
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CommandsListContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return <CommandsListContent />;
};