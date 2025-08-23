import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { debugLogger } from '@/lib/debugLogger';

export interface Coupon {
  id: string;
  barbershop_id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  applies_to: 'order' | 'specific_items';
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponApplicableItem {
  id: string;
  coupon_id: string;
  item_type: 'service' | 'product';
  item_id: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  error?: string;
  discount_amount?: number;
  coupon?: Coupon;
}

export const useCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchCoupons();
    }
  }, [profile?.barbershop_id]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      debugLogger.billing.info('useCoupons', 'Fetching coupons', { barbershopId: profile?.barbershop_id });

      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('barbershop_id', profile?.barbershop_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      debugLogger.billing.info('useCoupons', 'Coupons fetched successfully', { count: data.length });
      setCoupons(data as Coupon[] || []);
    } catch (error) {
      debugLogger.billing.error('useCoupons', 'Error fetching coupons', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar cupons",
        description: "Não foi possível carregar os cupons."
      });
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async (couponData: Omit<Coupon, 'id' | 'barbershop_id' | 'usage_count' | 'created_at' | 'updated_at'>, applicableItems?: { item_type: 'service' | 'product', item_id: string }[]) => {
    try {
      debugLogger.billing.info('useCoupons', 'Creating coupon', { code: couponData.code });

      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .insert({
          ...couponData,
          barbershop_id: profile?.barbershop_id,
          usage_count: 0
        })
        .select()
        .single();

      if (couponError) throw couponError;

      // Insert applicable items if specified
      if (applicableItems && applicableItems.length > 0 && couponData.applies_to === 'specific_items') {
        const itemsToInsert = applicableItems.map(item => ({
          coupon_id: coupon.id,
          item_type: item.item_type,
          item_id: item.item_id
        }));

        const { error: itemsError } = await supabase
          .from('coupon_applicable_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      await fetchCoupons();
      debugLogger.billing.info('useCoupons', 'Coupon created successfully', { id: coupon.id });
      
      toast({
        title: "Cupom criado",
        description: `Cupom ${couponData.code} foi criado com sucesso.`
      });

      return coupon.id;
    } catch (error) {
      debugLogger.billing.error('useCoupons', 'Error creating coupon', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar cupom",
        description: "Não foi possível criar o cupom."
      });
      return null;
    }
  };

  const updateCoupon = async (couponId: string, updates: Partial<Coupon>, applicableItems?: { item_type: 'service' | 'product', item_id: string }[]) => {
    try {
      debugLogger.billing.info('useCoupons', 'Updating coupon', { id: couponId });

      const { error: couponError } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', couponId);

      if (couponError) throw couponError;

      // Update applicable items if specified
      if (applicableItems !== undefined) {
        // Delete existing items
        await supabase
          .from('coupon_applicable_items')
          .delete()
          .eq('coupon_id', couponId);

        // Insert new items
        if (applicableItems.length > 0) {
          const itemsToInsert = applicableItems.map(item => ({
            coupon_id: couponId,
            item_type: item.item_type,
            item_id: item.item_id
          }));

          const { error: itemsError } = await supabase
            .from('coupon_applicable_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      await fetchCoupons();
      debugLogger.billing.info('useCoupons', 'Coupon updated successfully', { id: couponId });
      
      toast({
        title: "Cupom atualizado",
        description: "Cupom foi atualizado com sucesso."
      });

      return true;
    } catch (error) {
      debugLogger.billing.error('useCoupons', 'Error updating coupon', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar cupom",
        description: "Não foi possível atualizar o cupom."
      });
      return false;
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      debugLogger.billing.info('useCoupons', 'Deleting coupon', { id: couponId });

      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      await fetchCoupons();
      debugLogger.billing.info('useCoupons', 'Coupon deleted successfully', { id: couponId });
      
      toast({
        title: "Cupom excluído",
        description: "Cupom foi excluído com sucesso."
      });

      return true;
    } catch (error) {
      debugLogger.billing.error('useCoupons', 'Error deleting coupon', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir cupom",
        description: "Não foi possível excluir o cupom."
      });
      return false;
    }
  };

  const validateCoupon = async (code: string, orderAmount: number, items: { item_type: 'service' | 'product', item_id: string, price: number }[] = []): Promise<CouponValidationResult> => {
    try {
      debugLogger.billing.info('useCoupons', 'Validating coupon', { code, orderAmount, itemsCount: items.length });

      // Find coupon
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('barbershop_id', profile?.barbershop_id)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        return { isValid: false, error: 'Cupom não encontrado ou inativo' };
      }

      const typedCoupon = coupon as Coupon;

      const now = new Date();
      const validFrom = new Date(typedCoupon.valid_from);
      const validUntil = typedCoupon.valid_until ? new Date(typedCoupon.valid_until) : null;

      // Check date validity
      if (now < validFrom) {
        return { isValid: false, error: 'Cupom ainda não está válido' };
      }

      if (validUntil && now > validUntil) {
        return { isValid: false, error: 'Cupom expirado' };
      }

      // Check usage limit
      if (typedCoupon.usage_limit && typedCoupon.usage_count >= typedCoupon.usage_limit) {
        return { isValid: false, error: 'Limite de uso do cupom excedido' };
      }

      // Check minimum order amount
      if (orderAmount < typedCoupon.min_order_amount) {
        return { isValid: false, error: `Valor mínimo do pedido: R$ ${typedCoupon.min_order_amount.toFixed(2)}` };
      }

      let discountAmount = 0;

      if (typedCoupon.applies_to === 'order') {
        // Apply to entire order
        if (typedCoupon.discount_type === 'percentage') {
          discountAmount = (orderAmount * typedCoupon.discount_value) / 100;
        } else {
          discountAmount = typedCoupon.discount_value;
        }
      } else {
        // Apply to specific items
        const { data: applicableItems } = await supabase
          .from('coupon_applicable_items')
          .select('*')
          .eq('coupon_id', typedCoupon.id);

        if (!applicableItems || applicableItems.length === 0) {
          return { isValid: false, error: 'Cupom não possui itens aplicáveis configurados' };
        }

        const eligibleItems = items.filter(item => 
          applicableItems.some(ai => ai.item_type === item.item_type && ai.item_id === item.item_id)
        );

        if (eligibleItems.length === 0) {
          return { isValid: false, error: 'Nenhum item do pedido é elegível para este cupom' };
        }

        const eligibleAmount = eligibleItems.reduce((sum, item) => sum + item.price, 0);

        if (typedCoupon.discount_type === 'percentage') {
          discountAmount = (eligibleAmount * typedCoupon.discount_value) / 100;
        } else {
          discountAmount = Math.min(typedCoupon.discount_value, eligibleAmount);
        }
      }

      // Apply maximum discount limit
      if (typedCoupon.max_discount_amount && discountAmount > typedCoupon.max_discount_amount) {
        discountAmount = typedCoupon.max_discount_amount;
      }

      // Ensure discount doesn't exceed order amount
      discountAmount = Math.min(discountAmount, orderAmount);

      debugLogger.billing.info('useCoupons', 'Coupon validation successful', { 
        code, 
        discountAmount, 
        couponType: coupon.discount_type 
      });

      return {
        isValid: true,
        discount_amount: discountAmount,
        coupon: typedCoupon
      };
    } catch (error) {
      debugLogger.billing.error('useCoupons', 'Error validating coupon', error);
      return { isValid: false, error: 'Erro ao validar cupom' };
    }
  };

  const recordRedemption = async (couponId: string, commandId: string | null, saleId: string | null, clientId: string | null, discountAmount: number) => {
    try {
      debugLogger.billing.info('useCoupons', 'Recording coupon redemption', { 
        couponId, 
        commandId, 
        saleId, 
        discountAmount 
      });

      const { error: redemptionError } = await supabase
        .from('coupon_redemptions')
        .insert({
          coupon_id: couponId,
          barbershop_id: profile?.barbershop_id,
          command_id: commandId,
          sale_id: saleId,
          client_id: clientId,
          discount_amount: discountAmount
        });

      if (redemptionError) throw redemptionError;

      // Increment usage count manually
      const { data: currentCoupon } = await supabase
        .from('coupons')
        .select('usage_count')
        .eq('id', couponId)
        .single();

      if (currentCoupon) {
        await supabase
          .from('coupons')
          .update({ usage_count: currentCoupon.usage_count + 1 })
          .eq('id', couponId);
      }

      await fetchCoupons();
      debugLogger.billing.info('useCoupons', 'Coupon redemption recorded successfully');
    } catch (error) {
      debugLogger.billing.error('useCoupons', 'Error recording redemption', error);
      throw error;
    }
  };

  return {
    coupons,
    loading,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    recordRedemption,
    refetchCoupons: fetchCoupons
  };
};