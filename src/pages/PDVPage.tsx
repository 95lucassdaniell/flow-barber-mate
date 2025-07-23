import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SearchInput } from '@/components/ui/search-input';
import { Calculator, ShoppingCart, User, CreditCard, Trash2, Plus, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useProviders } from '@/hooks/useProviders';
import { useServices } from '@/hooks/useServices';
import { useProducts } from '@/hooks/useProducts';
import { useProviderServices } from '@/hooks/useProviderServices';
import { useSales, type SaleFormData } from '@/hooks/useSales';
import { useCashRegister } from '@/hooks/useCashRegister';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useFullscreen } from '@/hooks/useFullscreen';
import { CashRegisterStatus } from '@/components/pdv/CashRegisterStatus';
import { SalesHistory } from '@/components/pdv/SalesHistory';
import { CloseCashModal } from '@/components/pdv/CloseCashModal';

interface CartItem {
  id: string;
  type: 'service' | 'product';
  name: string;
  price: number;
  quantity: number;
  commission_rate: number;
  service_id?: string;
  product_id?: string;
}

const PDVPage = () => {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pix' | 'multiple'>('cash');
  const [notes, setNotes] = useState('');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const debouncedServiceSearch = useDebounce(serviceSearchTerm, 300);
  const debouncedProductSearch = useDebounce(productSearchTerm, 300);

  const { clients } = useClients();
  const { providers } = useProviders();
  const { services } = useServices();
  const { data: products } = useProducts();
  const { getServicesWithPrices } = useProviderServices(selectedBarber);
  const { createSale } = useSales();
  const { 
    currentCashRegister, 
    cartItems: persistedCartItems, 
    loading: cashLoading,
    saveCartItem, 
    removeCartItem, 
    updateCartItemQuantity,
    clearCartItems,
    updateCashRegisterTotals 
  } = useCashRegister();
  const { toast } = useToast();

  const servicesWithPrices = getServicesWithPrices();

  // Filtrar serviços com base na pesquisa
  const filteredServices = useMemo(() => {
    if (!debouncedServiceSearch) return servicesWithPrices;
    
    return servicesWithPrices.filter(service =>
      service.name.toLowerCase().includes(debouncedServiceSearch.toLowerCase())
    );
  }, [servicesWithPrices, debouncedServiceSearch]);

  // Filtrar produtos com base na pesquisa (nome ou código de barras)
  const filteredProducts = useMemo(() => {
    if (!debouncedProductSearch) {
      return products?.filter(product => product.is_active && product.stock_quantity > 0) || [];
    }
    
    const searchTerm = debouncedProductSearch.toLowerCase();
    return products?.filter(product => 
      product.is_active && 
      product.stock_quantity > 0 &&
      (product.name.toLowerCase().includes(searchTerm) ||
       product.barcode?.toLowerCase().includes(searchTerm))
    ) || [];
  }, [products, debouncedProductSearch]);

  // Converter itens persistidos para formato do carrinho local
  const cart = useMemo(() => {
    return persistedCartItems.map(item => ({
      id: item.id,
      type: item.item_type,
      name: item.item_type === 'service' 
        ? services.find(s => s.id === item.service_id)?.name || 'Serviço'
        : products?.find(p => p.id === item.product_id)?.name || 'Produto',
      price: item.unit_price,
      quantity: item.quantity,
      commission_rate: item.commission_rate,
      service_id: item.service_id,
      product_id: item.product_id,
    }));
  }, [persistedCartItems, services, products]);

  const addToCart = async (item: CartItem) => {
    const existingItem = persistedCartItems.find(cartItem => 
      cartItem.item_type === item.type && 
      (cartItem.service_id === item.service_id || cartItem.product_id === item.product_id)
    );

    if (existingItem) {
      await updateCartItemQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      await saveCartItem({
        item_type: item.type,
        service_id: item.service_id,
        product_id: item.product_id,
        quantity: 1,
        unit_price: item.price,
        commission_rate: item.commission_rate,
        client_id: selectedClient || undefined,
        barber_id: selectedBarber || undefined,
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    await removeCartItem(itemId);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeCartItem(itemId);
      return;
    }

    await updateCartItemQuantity(itemId, quantity);
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getFinalAmount = () => {
    return getTotalAmount() - discount;
  };

  const getTotalCommissions = () => {
    return cart.reduce((sum, item) => 
      sum + ((item.price * item.quantity) * (item.commission_rate / 100)), 0
    );
  };

  const handleBarcodeClick = () => {
    // Implementar scanner de código de barras em versão futura
    toast({
      title: "Scanner de código de barras",
      description: "Funcionalidade será implementada em breve.",
    });
  };

  const handleFinalizeSale = async () => {
    if (!selectedClient || !selectedBarber) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um cliente e um profissional.",
        variant: "destructive",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione pelo menos um item ao carrinho.",
        variant: "destructive",
      });
      return;
    }

    const saleData: SaleFormData = {
      client_id: selectedClient,
      barber_id: selectedBarber,
      items: persistedCartItems.map(item => ({
        item_type: item.item_type,
        service_id: item.service_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        commission_rate: item.commission_rate,
      })),
      discount_amount: discount,
      payment_method: paymentMethod,
      notes: notes,
    };

    const saleId = await createSale(saleData, currentCashRegister?.id);
    
    if (saleId) {
      // Atualizar totais do caixa
      await updateCashRegisterTotals(getFinalAmount(), paymentMethod);
      
      // Limpar carrinho e formulário
      await clearCartItems();
      setSelectedClient('');
      setSelectedBarber('');
      setDiscount(0);
      setNotes('');
      setPaymentMethod('cash');
      setServiceSearchTerm('');
      setProductSearchTerm('');
    }
  };

  const PDVContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDV - Ponto de Venda</h1>
          <p className="text-muted-foreground">
            Registre vendas de produtos e serviços
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="flex items-center gap-2"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4" />
              Sair Tela Cheia
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              Tela Cheia
            </>
          )}
        </Button>
      </div>

      {/* Status do Caixa */}
      {currentCashRegister && (
        <CashRegisterStatus
          onViewHistory={() => setShowSalesHistory(true)}
          onCloseCash={() => setShowCloseCashModal(true)}
        />
      )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seleção de Cliente e Profissional */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações da Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barber">Profissional</Label>
                  <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Serviços e Produtos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Serviços e Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="services" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="services">Serviços</TabsTrigger>
                    <TabsTrigger value="products">Produtos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="services" className="space-y-4">
                    <SearchInput
                      value={serviceSearchTerm}
                      onChange={setServiceSearchTerm}
                      placeholder="Pesquisar serviços..."
                      className="mb-4"
                    />
                    <ScrollArea className="h-96">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredServices.length === 0 ? (
                          <div className="col-span-2 text-center py-8 text-muted-foreground">
                            {serviceSearchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço disponível'}
                          </div>
                        ) : (
                          filteredServices.map(service => (
                          <Card 
                            key={service.id} 
                            className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => service.price && addToCart({
                              id: `service-${service.id}`,
                              type: 'service',
                              name: service.name,
                              price: service.price,
                              quantity: 1,
                              commission_rate: 50, // Default commission rate
                              service_id: service.id,
                            })}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{service.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {service.duration_minutes}min
                                  </p>
                                </div>
                                <div className="text-right">
                                  {service.price ? (
                                    <p className="font-bold text-primary">
                                      R$ {service.price.toFixed(2)}
                                    </p>
                                  ) : (
                                    <Badge variant="secondary">Sem preço</Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="products" className="space-y-4">
                    <SearchInput
                      value={productSearchTerm}
                      onChange={setProductSearchTerm}
                      placeholder="Pesquisar por nome ou código de barras..."
                      className="mb-4"
                      showBarcodeScanner
                      onBarcodeClick={handleBarcodeClick}
                    />
                    <ScrollArea className="h-96">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredProducts.length === 0 ? (
                          <div className="col-span-2 text-center py-8 text-muted-foreground">
                            {productSearchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto em estoque'}
                          </div>
                        ) : (
                          filteredProducts.map(product => (
                          <Card 
                            key={product.id} 
                            className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => addToCart({
                              id: `product-${product.id}`,
                              type: 'product',
                              name: product.name,
                              price: product.selling_price,
                              quantity: 1,
                              commission_rate: product.commission_rate || 0,
                              product_id: product.id,
                            })}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{product.name}</h4>
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                      Estoque: {product.stock_quantity}
                                    </p>
                                    {product.barcode && (
                                      <p className="text-xs text-muted-foreground">
                                        Código: {product.barcode}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary">
                                    R$ {product.selling_price.toFixed(2)}
                                  </p>
                                  {product.commission_rate && (
                                    <p className="text-xs text-muted-foreground">
                                      Comissão: {product.commission_rate}%
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Carrinho de Vendas */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Carrinho ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-64">
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Carrinho vazio
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{item.name}</h5>
                            <p className="text-xs text-muted-foreground">
                              R$ {item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                {/* Desconto */}
                <div className="space-y-2">
                  <Label htmlFor="discount">Desconto (R$)</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0,00"
                  />
                </div>

                {/* Forma de Pagamento */}
                <div className="space-y-2">
                  <Label htmlFor="payment">Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="multiple">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações da venda..."
                  />
                </div>

                <Separator />

                {/* Resumo */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {getTotalAmount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Desconto:</span>
                    <span>- R$ {discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Comissão:</span>
                    <span>R$ {getTotalCommissions().toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>R$ {getFinalAmount().toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleFinalizeSale}
                  disabled={cart.length === 0 || !selectedClient || !selectedBarber}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Finalizar Venda
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );

  if (cashLoading) {
    return (
      <DashboardLayout activeTab="pdv">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando caixa...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentCashRegister) {
    return (
      <DashboardLayout activeTab="pdv">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Nenhum caixa ativo encontrado.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      {isFullscreen ? (
        <div className="min-h-screen bg-background p-6">
          <PDVContent />
        </div>
      ) : (
        <DashboardLayout activeTab="pdv">
          <PDVContent />
        </DashboardLayout>
      )}

      {/* Modais */}
      <SalesHistory
        isOpen={showSalesHistory}
        onClose={() => setShowSalesHistory(false)}
      />
      
      <CloseCashModal
        isOpen={showCloseCashModal}
        onClose={() => setShowCloseCashModal(false)}
      />
    </>
  );
};

export default PDVPage;