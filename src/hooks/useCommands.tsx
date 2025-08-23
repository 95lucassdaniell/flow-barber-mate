import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCashRegister } from "@/hooks/useCashRegister";
import { useSubscriptionValidation } from "@/hooks/useSubscriptionValidation";

export interface CommandItem {
  id: string;
  item_type: 'service' | 'product';
  service_id?: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  commission_rate: number;
  commission_amount: number;
  service?: {
    name: string;
  };
  product?: {
    name: string;
  };
}

export interface Command {
  id: string;
  command_number: number;
  appointment_id?: string;
  client_id: string;
  barber_id: string;
  barbershop_id: string;
  status: string;
  total_amount: number;
  payment_method?: string;
  payment_status: string;
  notes?: string;
  created_at: string;
  closed_at?: string;
  client?: {
    name: string;
    phone: string;
  };
  barber?: {
    full_name: string;
  };
  appointment?: {
    appointment_date: string;
    start_time: string;
    end_time: string;
  };
  command_items?: CommandItem[];
}

export interface CreateCommandItemData {
  command_id: string;
  item_type: 'service' | 'product';
  service_id?: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  commission_rate: number;
}

export const useCommands = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { currentCashRegister, updateCashRegisterTotals } = useCashRegister();
  const { validateServiceUsage, useSubscriptionService } = useSubscriptionValidation();

  const fetchCommands = async (status?: string, date?: Date) => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('commands')
        .select(`
          *,
          client:clients(name, phone),
          barber:profiles!commands_barber_id_fkey(full_name),
          appointment:appointments(appointment_date, start_time, end_time),
          command_items(
            *,
            service:services(name),
            product:products(name)
          )
        `)
        .eq('barbershop_id', profile.barbershop_id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setCommands(data as any || []);
    } catch (error) {
      console.error('Erro ao buscar comandas:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar comandas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addItemToCommand = async (commandId: string, itemData: CreateCommandItemData): Promise<boolean> => {
    try {
      // Buscar informações da comanda para validação de assinatura
      const { data: command, error: commandError } = await supabase
        .from('commands')
        .select('client_id, barber_id')
        .eq('id', commandId)
        .single();

      if (commandError) throw commandError;

      let finalUnitPrice = itemData.unit_price;
      let subscriptionUsed = false;
      let subscriptionId: string | null = null;

      // Se for um serviço, verificar se tem assinatura ativa
      if (itemData.item_type === 'service' && itemData.service_id) {
        const validation = await validateServiceUsage(
          command.client_id,
          command.barber_id,
          itemData.service_id,
          itemData.unit_price
        );

        if (validation.isValid && validation.subscription) {
          // Cliente tem assinatura ativa e serviço disponível
          finalUnitPrice = 0; // Serviço gratuito via assinatura
          subscriptionUsed = true;
          subscriptionId = validation.subscription.id;
          
          toast({
            title: "Assinatura Aplicada",
            description: `Serviço gratuito via assinatura. Restam ${validation.subscription.remaining_services - 1} serviços.`,
          });
        } else if (validation.message) {
          // Mostrar mensagem de validação (ex: sem saldo, serviço não incluído)
          toast({
            title: "Informação",
            description: validation.message,
            variant: "default",
          });
        }
      }

      const totalPrice = itemData.quantity * finalUnitPrice;
      const commissionAmount = totalPrice * (itemData.commission_rate / 100);

      const { error } = await supabase
        .from('command_items')
        .insert({
          command_id: commandId,
          item_type: itemData.item_type,
          service_id: itemData.service_id,
          product_id: itemData.product_id,
          quantity: itemData.quantity,
          unit_price: finalUnitPrice,
          total_price: totalPrice,
          commission_rate: itemData.commission_rate,
          commission_amount: commissionAmount,
        });

      if (error) throw error;

      // Se usou assinatura, decrementar o contador e registrar uso
      if (subscriptionUsed && subscriptionId) {
        await useSubscriptionService(
          subscriptionId,
          itemData.service_id!,
          commandId,
          itemData.unit_price // Preço original para histórico
        );
      }

      // Atualizar total da comanda
      await updateCommandTotal(commandId);
      
      toast({
        title: "Sucesso",
        description: subscriptionUsed 
          ? "Serviço adicionado via assinatura" 
          : "Item adicionado à comanda",
      });

      await fetchCommands();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar item à comanda",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeItemFromCommand = async (itemId: string, commandId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('command_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Atualizar total da comanda
      await updateCommandTotal(commandId);
      
      toast({
        title: "Sucesso",
        description: "Item removido da comanda",
      });

      await fetchCommands();
      return true;
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover item da comanda",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateCommandTotal = async (commandId: string) => {
    try {
      // Buscar todos os itens da comanda
      const { data: items, error: itemsError } = await supabase
        .from('command_items')
        .select('total_price')
        .eq('command_id', commandId);

      if (itemsError) throw itemsError;

      const totalAmount = items?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;

      // Atualizar total da comanda
      const { error: updateError } = await supabase
        .from('commands')
        .update({ total_amount: totalAmount })
        .eq('id', commandId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Erro ao atualizar total da comanda:', error);
    }
  };

  const closeCommand = async (
    commandId: string, 
    paymentMethod: string, 
    discount: number = 0,
    notes?: string,
    couponCode?: string | null,
    couponDiscount?: number
  ): Promise<boolean> => {
    try {
      // Buscar dados da comanda
      const { data: command, error: commandError } = await supabase
        .from('commands')
        .select(`
          *,
          command_items(*)
        `)
        .eq('id', commandId)
        .single();

      if (commandError) throw commandError;

      const finalAmount = command.total_amount - discount;

      // Fechar comanda
      const { error: closeError } = await supabase
        .from('commands')
        .update({
          status: 'closed',
          payment_method: paymentMethod,
          payment_status: 'paid',
          closed_at: new Date().toISOString(),
          notes: notes,
          total_amount: finalAmount,
          coupon_code: couponCode,
          discount_amount: discount
        })
        .eq('id', commandId);

      if (closeError) throw closeError;

      // Criar venda correspondente
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          client_id: command.client_id,
          barber_id: command.barber_id,
          barbershop_id: command.barbershop_id,
          created_by: profile?.id,
          total_amount: command.total_amount,
          discount_amount: discount,
          final_amount: finalAmount,
          payment_method: paymentMethod,
          payment_status: 'paid',
          notes: notes,
          cash_register_id: currentCashRegister?.id, // Associar ao caixa aberto
          coupon_code: couponCode,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar itens da venda
      if (command.command_items && Array.isArray(command.command_items)) {
        for (const item of command.command_items) {
          await supabase
            .from('sale_items')
            .insert({
              sale_id: sale.id,
              item_type: item.item_type,
              service_id: item.service_id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              commission_rate: item.commission_rate,
              commission_amount: item.commission_amount,
            });

          // Criar comissão
          await supabase
            .from('commissions')
            .insert({
              sale_id: sale.id,
              sale_item_id: sale.id,
              barber_id: command.barber_id,
              barbershop_id: command.barbershop_id,
              commission_type: item.item_type,
              base_amount: item.total_price,
              commission_rate: item.commission_rate,
              commission_amount: item.commission_amount,
              status: 'pending',
            });
        }
      }

      // Atualizar totais do caixa se estiver aberto
      if (currentCashRegister) {
        await updateCashRegisterTotals(finalAmount, paymentMethod);
      }

      toast({
        title: "Sucesso",
        description: "Comanda finalizada com sucesso",
      });

      await fetchCommands();
      return true;
    } catch (error) {
      console.error('Erro ao fechar comanda:', error);
      toast({
        title: "Erro",
        description: "Falha ao finalizar comanda",
        variant: "destructive",
      });
      return false;
    }
  };

  const getCommandByAppointment = async (appointmentId: string): Promise<Command | null> => {
    try {
      const { data, error } = await supabase
        .from('commands')
        .select(`
          *,
          client:clients(name, phone),
          barber:profiles!commands_barber_id_fkey(full_name),
          appointment:appointments(appointment_date, start_time, end_time),
          command_items(
            *,
            service:services(name),
            product:products(name)
          )
        `)
        .eq('appointment_id', appointmentId)
        .single();

      if (error) throw error;
      return data as any;
    } catch (error) {
      console.error('Erro ao buscar comanda do agendamento:', error);
      return null;
    }
  };

  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchCommands();
    }
  }, [profile?.barbershop_id]);

  // Real-time listeners
  useEffect(() => {
    if (!profile?.barbershop_id) return;

    const channel = supabase
      .channel('commands-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'command_items'
        },
        (payload) => {
          console.log('Item adicionado:', payload);
          fetchCommands();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'command_items'
        },
        (payload) => {
          console.log('Item removido:', payload);
          fetchCommands();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'commands'
        },
        (payload) => {
          console.log('Comanda atualizada:', payload);
          fetchCommands();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.barbershop_id]);

  // Função para recarregar uma comanda específica
  const refetchCommand = async (commandId: string) => {
    try {
      const { data, error } = await supabase
        .from('commands')
        .select(`
          *,
          client:clients(name, phone),
          barber:profiles!commands_barber_id_fkey(full_name),
          appointment:appointments(appointment_date, start_time, end_time),
          command_items(
            *,
            service:services(name),
            product:products(name)
          )
        `)
        .eq('id', commandId)
        .eq('barbershop_id', profile?.barbershop_id)
        .single();

      if (error) throw error;

      if (data) {
        setCommands(prev => 
          prev.map(cmd => cmd.id === commandId ? data as Command : cmd)
        );
        return data as Command;
      }
    } catch (error) {
      console.error('Erro ao recarregar comanda:', error);
      return null;
    }
  };

  return {
    commands,
    loading,
    fetchCommands,
    addItemToCommand,
    removeItemFromCommand,
    closeCommand,
    getCommandByAppointment,
    refetchCommand,
    refetchCommands: fetchCommands,
  };
};