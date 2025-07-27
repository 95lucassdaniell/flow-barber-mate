import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calculator,
  Clock,
  Receipt,
  Plus,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCashRegister } from '@/hooks/useCashRegister';
import { CashRegisterStatus } from '@/components/pdv/CashRegisterStatus';
import { OpenCashModal } from '@/components/pdv/OpenCashModal';
import { CloseCashModal } from '@/components/pdv/CloseCashModal';
import { SalesHistory } from '@/components/pdv/SalesHistory';
import { CashMovements } from '@/components/caixa/CashMovements';
import { AddCashMovementModal } from '@/components/caixa/AddCashMovementModal';
import { CashSummary } from '@/components/caixa/CashSummary';
import { CommandsList } from '@/components/caixa/CommandsList';

const CaixaPage = () => {
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showAddMovementModal, setShowAddMovementModal] = useState(false);
  
  const { profile } = useAuth();
  const { 
    currentCashRegister, 
    loading: cashLoading,
    openCashRegister,
    closeCashRegister,
    getCashRegisterSummary
  } = useCashRegister();

  // Check if user has permission to use cash register
  const canUseCash = profile?.role === 'admin' || profile?.role === 'receptionist';
  
  if (!canUseCash) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caixa</h1>
          <p className="text-muted-foreground">
            Controle de entradas e saídas do caixa
          </p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
              <p className="text-muted-foreground">
                Apenas administradores e recepcionistas podem acessar o caixa.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cashLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caixa</h1>
          <p className="text-muted-foreground">
            Controle de entradas e saídas do caixa
          </p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p className="text-muted-foreground">Carregando informações do caixa...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOpenCash = async (openingBalance?: number) => {
    return await openCashRegister(openingBalance);
  };

  const handleCloseCash = async (closingBalance: number, notes?: string) => {
    return await closeCashRegister(closingBalance, notes);
  };

  const summary = currentCashRegister ? getCashRegisterSummary() : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caixa</h1>
          <p className="text-muted-foreground">
            Controle de entradas e saídas do caixa
          </p>
        </div>
        
        {currentCashRegister && (
          <Button
            onClick={() => setShowAddMovementModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Movimentação
          </Button>
        )}
      </div>

      {/* Status do Caixa */}
      <CashRegisterStatus
        onViewHistory={() => setShowSalesHistory(true)}
        onCloseCash={() => setShowCloseCashModal(true)}
        onOpenCash={() => setShowOpenCashModal(true)}
      />

      {/* Conteúdo principal quando caixa está aberto */}
      {currentCashRegister && (
        <div className="space-y-6">
          {/* Resumo Financeiro */}
          <CashSummary />

          {/* Abas de Conteúdo */}
          <Tabs defaultValue="movements" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="movements" className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Movimentações
              </TabsTrigger>
              <TabsTrigger value="commands" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Comandas
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Vendas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="movements" className="space-y-4">
              <CashMovements />
            </TabsContent>
            
            <TabsContent value="commands" className="space-y-4">
              <CommandsList />
            </TabsContent>
            
            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Vendas do Dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SalesHistory 
                    open={showSalesHistory}
                    onOpenChange={setShowSalesHistory}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Modais */}
      <OpenCashModal 
        open={showOpenCashModal}
        onOpenChange={setShowOpenCashModal}
        onConfirm={handleOpenCash}
      />
      
      <CloseCashModal 
        open={showCloseCashModal}
        onOpenChange={setShowCloseCashModal}
        onConfirm={handleCloseCash}
      />

      <AddCashMovementModal
        open={showAddMovementModal}
        onOpenChange={setShowAddMovementModal}
      />
    </div>
  );
};

export default CaixaPage;