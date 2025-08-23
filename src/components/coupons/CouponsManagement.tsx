import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCoupons, type Coupon } from '@/hooks/useCoupons';
import { CouponModal } from './CouponModal';
import { debugLogger } from '@/lib/debugLogger';
import { format } from 'date-fns';

export const CouponsManagement = () => {
  const { coupons, loading, deleteCoupon, updateCoupon } = useCoupons();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  debugLogger.billing.info('CouponsManagement', 'Component rendered', { 
    couponsCount: coupons.length,
    loading,
    searchTerm
  });

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (coupon: Coupon) => {
    debugLogger.billing.info('CouponsManagement', 'Opening edit modal', { couponId: coupon.id });
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleDelete = async (couponId: string) => {
    debugLogger.billing.info('CouponsManagement', 'Deleting coupon', { couponId });
    await deleteCoupon(couponId);
  };

  const handleToggleActive = async (coupon: Coupon) => {
    debugLogger.billing.info('CouponsManagement', 'Toggling coupon active state', { 
      couponId: coupon.id, 
      currentState: coupon.is_active 
    });
    await updateCoupon(coupon.id, { is_active: !coupon.is_active });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCoupon(null);
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `R$ ${coupon.discount_value.toFixed(2)}`;
  };

  const getValidityText = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (now < validFrom) {
      return { text: `Válido a partir de ${format(validFrom, 'dd/MM/yyyy')}`, variant: 'secondary' as const };
    }

    if (validUntil && now > validUntil) {
      return { text: 'Expirado', variant: 'destructive' as const };
    }

    if (validUntil) {
      return { text: `Válido até ${format(validUntil, 'dd/MM/yyyy')}`, variant: 'default' as const };
    }

    return { text: 'Sem data de expiração', variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground">Gerencie cupons de desconto para sua barbearia</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cupons ({filteredCoupons.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por código ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum cupom encontrado.' : 'Nenhum cupom cadastrado.'}
              </p>
              {!searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro cupom
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Aplicável a</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => {
                  const validity = getValidityText(coupon);
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {coupon.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{coupon.name}</div>
                          {coupon.description && (
                            <div className="text-sm text-muted-foreground">{coupon.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getDiscountText(coupon)}
                        </Badge>
                        {coupon.min_order_amount > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Min: R$ {coupon.min_order_amount.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.applies_to === 'order' ? 'default' : 'secondary'}>
                          {coupon.applies_to === 'order' ? 'Pedido inteiro' : 'Itens específicos'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {coupon.usage_count}
                          {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={validity.variant}>
                          {validity.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                          {coupon.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(coupon)}
                          >
                            {coupon.is_active ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(coupon)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir cupom</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o cupom "{coupon.code}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(coupon.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CouponModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        coupon={selectedCoupon}
      />
    </div>
  );
};