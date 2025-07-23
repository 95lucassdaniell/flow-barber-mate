import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Clock, DollarSign, User, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCashRegister } from "@/hooks/useCashRegister";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sale } from "@/hooks/useSales";

interface SalesHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalesHistory = ({ isOpen, onClose }: SalesHistoryProps) => {
  const { currentCashRegister } = useCashRegister();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessionSales = async () => {
    if (!currentCashRegister) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          clients(name),
          profiles!sales_barber_id_fkey(full_name)
        `)
        .eq('cash_register_id', currentCashRegister.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar vendas da sessão:', error);
        return;
      }

      setSales(data || []);
    } catch (error) {
      console.error('Erro ao buscar vendas da sessão:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentCashRegister) {
      fetchSessionSales();
    }
  }, [isOpen, currentCashRegister]);

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

  const totalSessionRevenue = sales.reduce((sum, sale) => sum + sale.final_amount, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico da Sessão
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Resumo da sessão */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumo da Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {sales.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Vendas Realizadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {totalSessionRevenue.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Receita Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de vendas */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Vendas ({sales.length})</h3>
            
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3 pr-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando vendas...
                  </div>
                ) : sales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma venda realizada nesta sessão
                  </div>
                ) : (
                  sales.map((sale) => (
                    <Card key={sale.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              #{sale.id.slice(0, 8)}
                            </Badge>
                            {getPaymentMethodBadge(sale.payment_method)}
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            R$ {sale.final_amount.toFixed(2)}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>Cliente: {(sale as any).clients?.name || 'N/A'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-muted-foreground" />
                            <span>Profissional: {(sale as any).profiles?.full_name || 'N/A'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {format(new Date(sale.created_at), "HH:mm", { locale: ptBR })}
                            </span>
                          </div>

                          {sale.discount_amount > 0 && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span>Desconto: R$ {sale.discount_amount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>

                        {sale.notes && (
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            <strong>Observações:</strong> {sale.notes}
                          </div>
                        )}

                        <div className="flex justify-end mt-3">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};