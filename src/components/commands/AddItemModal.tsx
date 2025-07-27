import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Scissors, 
  Package,
  Search
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useServices } from "@/hooks/useServices";
import { useProducts } from "@/hooks/useProducts";
import { useCommands } from "@/hooks/useCommands";
import { useProviderServices } from "@/hooks/useProviderServices";

interface AddItemModalProps {
  command: any;
  isOpen: boolean;
  onClose: () => void;
}

const AddItemModal = ({ command, isOpen, onClose }: AddItemModalProps) => {
  const [selectedType, setSelectedType] = useState<'service' | 'product'>('service');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products = [] } = useProducts();
  const { providerServices, loading: servicesLoading } = useProviderServices(command?.barber_id);
  const { addItemToCommand } = useCommands();

  // Serviços do barbeiro com preços configurados
  const barberServices = providerServices.filter(ps => ps.is_active);

  // Filtrar produtos disponíveis
  const availableProducts = products.filter(p => 
    p.is_active && 
    (searchTerm === "" || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filtrar serviços disponíveis
  const availableServices = barberServices.filter(ps => {
    return ps.service && (searchTerm === "" || ps.service.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    if (selectedType === 'service') {
      setCustomPrice(item.price || 0);
    } else {
      setCustomPrice(item.selling_price || 0);
    }
  };

  const handleAddItem = async () => {
    if (!selectedItem || !command) return;

    setLoading(true);
    
    try {
      const itemData = {
        command_id: command.id,
        item_type: selectedType,
        service_id: selectedType === 'service' ? selectedItem.service_id : undefined,
        product_id: selectedType === 'product' ? selectedItem.id : undefined,
        quantity,
        unit_price: customPrice,
        commission_rate: selectedType === 'service' 
          ? (command.barber?.commission_rate || 0) 
          : (selectedItem.commission_rate || 0)
      };

      const success = await addItemToCommand(command.id, itemData);
      if (success) {
        onClose();
        // Reset form
        setSelectedItem(null);
        setQuantity(1);
        setCustomPrice(0);
        setSearchTerm("");
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    } finally {
      setLoading(false);
    }
  };

  const total = quantity * customPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Plus className="w-6 h-6" />
            Adicionar Item à Comanda
          </DialogTitle>
          <DialogDescription>
            Selecione um serviço ou produto para adicionar à comanda #{command?.command_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar serviços ou produtos..."
              className="pl-10"
            />
          </div>

          {/* Tabs de tipo */}
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as 'service' | 'product')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="service" className="flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Serviços ({availableServices.length})
              </TabsTrigger>
              <TabsTrigger value="product" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Produtos ({availableProducts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="service" className="space-y-4">
              {availableServices.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
                    <p className="text-muted-foreground">
                      O barbeiro não possui serviços cadastrados ou não foram encontrados serviços com o termo pesquisado.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableServices.map((providerService) => {
                    const service = providerService.service;
                    if (!service) return null;
                    
                    const isSelected = selectedItem?.service_id === service.id;
                    
                    return (
                      <Card 
                        key={providerService.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleItemSelect(providerService)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{service.name}</h4>
                            <Badge variant="secondary">
                              {service.duration_minutes}min
                            </Badge>
                          </div>
                          
                          {service.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {service.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">
                              {formatCurrency(providerService.price)}
                            </span>
                            {isSelected && (
                              <Badge>Selecionado</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="product" className="space-y-4">
              {availableProducts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                    <p className="text-muted-foreground">
                      Não foram encontrados produtos disponíveis com o termo pesquisado.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableProducts.map((product) => {
                    const isSelected = selectedItem?.id === product.id;
                    
                    return (
                      <Card 
                        key={product.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleItemSelect(product)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{product.name}</h4>
                            <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                              Estoque: {product.stock_quantity}
                            </Badge>
                          </div>
                          
                          {product.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {product.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">
                              {formatCurrency(product.selling_price)}
                            </span>
                            {isSelected && (
                              <Badge>Selecionado</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Configurações do item selecionado */}
          {selectedItem && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurar Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Preço Unitário (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">Total do Item:</span>
                  <span className="text-xl font-bold">{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleAddItem} 
              disabled={!selectedItem || loading || quantity < 1 || customPrice <= 0}
              className="flex-1"
            >
              {loading ? "Adicionando..." : "Adicionar Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemModal;