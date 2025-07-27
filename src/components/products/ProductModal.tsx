import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateProduct, useUpdateProduct, Product, ProductFormData } from '@/hooks/useProducts';
import { Calculator, DollarSign } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
}

const PRODUCT_CATEGORIES = [
  'doces',
  'chocolates',
  'cosméticos',
  'bebidas',
  'acessórios',
  'higiene',
  'cuidados pessoais',
  'geral'
];

export const ProductModal = ({ isOpen, onClose, product }: ProductModalProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: 'geral',
    barcode: '',
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock_alert: 5,
    supplier: '',
    image_url: '',
    is_active: true,
    commission_rate: 0,
    commission_type: 'percentage',
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  useEffect(() => {
    console.log('ProductModal useEffect - product:', product, 'isOpen:', isOpen);
    
    if (product) {
      console.log('Setting form data with product:', product);
      const newFormData = {
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'geral',
        barcode: product.barcode || '',
        cost_price: Number(product.cost_price) || 0,
        selling_price: Number(product.selling_price) || 0,
        stock_quantity: Number(product.stock_quantity) || 0,
        min_stock_alert: Number(product.min_stock_alert) || 5,
        supplier: product.supplier || '',
        image_url: product.image_url || '',
        is_active: Boolean(product.is_active),
        commission_rate: Number(product.commission_rate) || 0,
        commission_type: product.commission_type || 'percentage',
      };
      console.log('New form data:', newFormData);
      setFormData(newFormData);
    } else {
      console.log('Resetting form data for new product');
      setFormData({
        name: '',
        description: '',
        category: 'geral',
        barcode: '',
        cost_price: 0,
        selling_price: 0,
        stock_quantity: 0,
        min_stock_alert: 5,
        supplier: '',
        image_url: '',
        is_active: true,
        commission_rate: 0,
        commission_type: 'percentage',
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (product) {
        await updateProduct.mutateAsync({ ...formData, id: product.id });
      } else {
        await createProduct.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const calculateProfitMargin = () => {
    if (formData.cost_price > 0 && formData.selling_price > 0) {
      const margin = ((formData.selling_price - formData.cost_price) / formData.selling_price) * 100;
      return margin.toFixed(1);
    }
    return '0';
  };

  const calculateMarkup = () => {
    if (formData.cost_price > 0 && formData.selling_price > 0) {
      const markup = ((formData.selling_price - formData.cost_price) / formData.cost_price) * 100;
      return markup.toFixed(1);
    }
    return '0';
  };

  const calculateCommission = () => {
    if (formData.commission_type === 'percentage') {
      return ((formData.selling_price * formData.commission_rate) / 100).toFixed(2);
    }
    return formData.commission_rate.toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            {product ? 'Edite as informações do produto selecionado.' : 'Adicione um novo produto ao seu catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do produto"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Código de barras"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Nome do fornecedor"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <h3 className="font-medium">Preços e Margem</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Preço de Custo (R$) *</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">Preço de Venda (R$) *</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            {formData.cost_price > 0 && formData.selling_price > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <span className="text-muted-foreground">Margem de Lucro:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {calculateProfitMargin()}%
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Markup:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    {calculateMarkup()}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <h3 className="font-medium">Comissão por Venda</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission_type">Tipo de Comissão</Label>
                <Select
                  value={formData.commission_type}
                  onValueChange={(value: 'percentage' | 'fixed') => 
                    setFormData({ ...formData, commission_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission_rate">
                  {formData.commission_type === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}
                </Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step={formData.commission_type === 'percentage' ? '0.1' : '0.01'}
                  min="0"
                  max={formData.commission_type === 'percentage' ? '100' : undefined}
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.commission_type === 'percentage' ? '0.0' : '0.00'}
                />
              </div>
            </div>

            {formData.selling_price > 0 && formData.commission_rate > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <span className="text-muted-foreground">Comissão por venda:</span>
                  <span className="ml-2 font-medium text-primary">
                    R$ {calculateCommission()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Quantidade em Estoque *</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock_alert">Alerta de Estoque Baixo</Label>
              <Input
                id="min_stock_alert"
                type="number"
                min="0"
                value={formData.min_stock_alert}
                onChange={(e) => setFormData({ ...formData, min_stock_alert: parseInt(e.target.value) || 0 })}
                placeholder="5"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Produto ativo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {createProduct.isPending || updateProduct.isPending
                ? 'Salvando...'
                : product
                ? 'Atualizar'
                : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};