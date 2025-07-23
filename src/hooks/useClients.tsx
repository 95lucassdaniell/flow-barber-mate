import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  notes?: string;
  barbershop_id: string;
  created_at: string;
  updated_at: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchClients = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        toast({
          title: "Erro ao carregar clientes",
          description: "Ocorreu um erro ao buscar os clientes.",
          variant: "destructive",
        });
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'barbershop_id'>) => {
    if (!profile?.barbershop_id) return false;

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            ...clientData,
            barbershop_id: profile.barbershop_id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar cliente:', error);
        toast({
          title: "Erro ao adicionar cliente",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setClients(prev => [...prev, data]);
      toast({
        title: "Cliente adicionado",
        description: `${clientData.name} foi adicionado com sucesso.`,
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao adicionar cliente:', error);
      toast({
        title: "Erro ao adicionar cliente",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateClient = async (clientId: string, clientData: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cliente:', error);
        toast({
          title: "Erro ao atualizar cliente",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setClients(prev => prev.map(client => 
        client.id === clientId ? data : client
      ));
      
      toast({
        title: "Cliente atualizado",
        description: "As informações do cliente foram atualizadas com sucesso.",
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: "Erro ao atualizar cliente",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Erro ao deletar cliente:', error);
        toast({
          title: "Erro ao deletar cliente",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setClients(prev => prev.filter(client => client.id !== clientId));
      toast({
        title: "Cliente removido",
        description: "O cliente foi removido com sucesso.",
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao deletar cliente:', error);
      toast({
        title: "Erro ao deletar cliente",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchClients();
  }, [profile?.barbershop_id]);

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    refetchClients: fetchClients,
  };
};