import { useState, useEffect } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCoupons, type Coupon } from '@/hooks/useCoupons';
import { useServices } from '@/hooks/useServices';
import { useProducts } from '@/hooks/useProducts';
import { debugLogger } from '@/lib/debugLogger';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon?: Coupon | null;
}

export const CouponModal = ({ isOpen, onClose, coupon }: CouponModalProps) => {
  const { createCoupon, updateCoupon } = useCoupons();
  const { services } = useServices();
  const { data: products } = useProducts();
  const [loading, setLoading] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [appliesTo, setAppliesTo] = useState<'order' | 'specific_items'>('order');
  const [validFrom, setValidFrom] = useState<Date>(new Date());
  const [validUntil, setValidUntil] = useState<Date | undefined>(undefined);
  const [hasExpiryDate, setHasExpiryDate] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [selectedItems, setSelectedItems] = useState<{ item_type: 'service' | 'product', item_id: string, name: string }[]>([]);

  const isEditing = !!coupon;

  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        // Edit mode - populate form
        debugLogger.billing.info('CouponModal', 'Loading coupon for editing', { couponId: coupon.id });
        
        setCode(coupon.code);
        setName(coupon.name);
        setDescription(coupon.description || '');
        setDiscountType(coupon.discount_type);
        setDiscountValue(coupon.discount_value.toString());
        setMinOrderAmount(coupon.min_order_amount.toString());
        setMaxDiscountAmount(coupon.max_discount_amount?.toString() || '');
        setUsageLimit(coupon.usage_limit?.toString() || '');
        setAppliesTo(coupon.applies_to);
        setValidFrom(new Date(coupon.valid_from));
        setValidUntil(coupon.valid_until ? new Date(coupon.valid_until) : undefined);
        setHasExpiryDate(!!coupon.valid_until);
        setIsActive(coupon.is_active);

        // Load applicable items if editing
        if (coupon.applies_to === 'specific_items') {
          loadApplicableItems(coupon.id);
        }
      } else {
        // Create mode - reset form
        debugLogger.billing.info('CouponModal', 'Opening modal for new coupon');
        resetForm();
      }
    }
  }, [isOpen, coupon]);

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderAmount('0');
    setMaxDiscountAmount('');
    setUsageLimit('');
    setAppliesTo('order');
    setValidFrom(new Date());
    setValidUntil(undefined);
    setHasExpiryDate(false);
    setIsActive(true);
    setSelectedItems([]);
  };

  const loadApplicableItems = async (couponId: string) => {
    // This would require another hook or API call to get applicable items
    // For now, we'll leave it empty and the user will need to re-select items when editing
    debugLogger.billing.info('CouponModal', 'Loading applicable items', { couponId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || !name || !discountValue) {
      debugLogger.billing.warn('CouponModal', 'Validation failed - missing required fields');
      return;
    }

    setLoading(true);
    debugLogger.billing.info('CouponModal', isEditing ? 'Updating coupon' : 'Creating coupon', { 
      code, 
      appliesTo, 
      selectedItemsCount: selectedItems.length 
    });

    try {
      const couponData = {
        code: code.toUpperCase(),
        name,
        description: description || undefined,
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_order_amount: parseFloat(minOrderAmount) || 0,
        max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined,
        usage_limit: usageLimit ? parseInt(usageLimit) : undefined,
        applies_to: appliesTo,
        valid_from: validFrom.toISOString(),
        valid_until: hasExpiryDate && validUntil ? validUntil.toISOString() : undefined,
        is_active: isActive
      };

      const applicableItems = appliesTo === 'specific_items' ? selectedItems.map(item => ({
        item_type: item.item_type,
        item_id: item.item_id
      })) : undefined;

      let success;
      if (isEditing && coupon) {
        success = await updateCoupon(coupon.id, couponData, applicableItems);
      } else {
        success = await createCoupon(couponData, applicableItems);
      }

      if (success) {
        onClose();
      }
    } catch (error) {
      debugLogger.billing.error('CouponModal', 'Error submitting coupon', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (itemType: 'service' | 'product', itemId: string) => {
    const allItems = [
      ...services.map(s => ({ id: s.id, name: s.name, type: 'service' as const })),
      ...(products || []).map(p => ({ id: p.id, name: p.name, type: 'product' as const }))
    ];

    const item = allItems.find(i => i.id === itemId && i.type === itemType);
    if (item && !selectedItems.some(si => si.item_id === itemId && si.item_type === itemType)) {
      setSelectedItems([...selectedItems, {
        item_type: itemType,
        item_id: itemId,
        name: item.name
      }]);
    }
  };

  const handleRemoveItem = (itemId: string, itemType: 'service' | 'product') => {
    setSelectedItems(selectedItems.filter(item => 
      !(item.item_id === itemId && item.item_type === itemType)
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cupom' : 'Novo Cupom'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Código do Cupom*</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ex: DESCONTO10"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Nome do Cupom*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Desconto de 10%"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional do cupom"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount-type">Tipo de Desconto</Label>
              <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discount-value">
                Valor do Desconto* {discountType === 'percentage' ? '(%)' : '(R$)'}
              </Label>
              <Input
                id="discount-value"
                type="number"
                step={discountType === 'percentage' ? '1' : '0.01'}
                min="0"
                max={discountType === 'percentage' ? '100' : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-order">Valor Mínimo do Pedido (R$)</Label>
              <Input
                id="min-order"
                type="number"
                step="0.01"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="max-discount">Desconto Máximo (R$)</Label>
              <Input
                id="max-discount"
                type="number"
                step="0.01"
                min="0"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="usage-limit">Limite de Usos</Label>
            <Input
              id="usage-limit"
              type="number"
              min="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Opcional - deixe em branco para ilimitado"
            />
          </div>

          <div>
            <Label htmlFor="applies-to">Aplicável a</Label>
            <Select value={appliesTo} onValueChange={(value: 'order' | 'specific_items') => setAppliesTo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order">Pedido inteiro</SelectItem>
                <SelectItem value="specific_items">Itens específicos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {appliesTo === 'specific_items' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Itens Aplicáveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Serviços</Label>
                    <Select onValueChange={(value) => handleAddItem('service', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Produtos</Label>
                    <Select onValueChange={(value) => handleAddItem('product', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {(products || []).map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedItems.length > 0 && (
                  <div className="space-y-2">
                    <Label>Itens Selecionados:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map((item) => (
                        <Badge key={`${item.item_type}-${item.item_id}`} variant="secondary">
                          {item.name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0"
                            onClick={() => handleRemoveItem(item.item_id, item.item_type)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !validFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validFrom ? format(validFrom, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={validFrom}
                    onSelect={(date) => date && setValidFrom(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Switch
                  checked={hasExpiryDate}
                  onCheckedChange={setHasExpiryDate}
                />
                <Label>Data de Expiração</Label>
              </div>
              {hasExpiryDate && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !validUntil && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {validUntil ? format(validUntil, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={validUntil}
                      onSelect={setValidUntil}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => date < validFrom}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label>Cupom ativo</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};