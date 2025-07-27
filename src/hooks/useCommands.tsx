import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

  const fetchCommands = async (status?: string) => {
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
      const totalPrice = itemData.quantity * itemData.unit_price;
      const commissionAmount = totalPrice * (itemData.commission_rate / 100);

      const { error } = await supabase
        .from('command_items')
        .insert({
          command_id: commandId,
          item_type: itemData.item_type,
          service_id: itemData.service_id,
          product_id: itemData.product_id,
          quantity: itemData.quantity,
          unit_price: itemData.unit_price,
          total_price: totalPrice,
          commission_rate: itemData.commission_rate,
          commission_amount: commissionAmount,
        });

      if (error) throw error;

      // Atualizar total da comanda
      await updateCommandTotal(commandId);
      
      toast({
        title: "Sucesso",
        description: "Item adicionado à comanda",
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
    notes?: string
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
          total_amount: finalAmount
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

  return {
    commands,
    loading,
    fetchCommands,
    addItemToCommand,
    removeItemFromCommand,
    closeCommand,
    getCommandByAppointment,
    refetchCommands: fetchCommands,
  };
};