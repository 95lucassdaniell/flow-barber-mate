import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  barbershop_id: string;
  created_at: string;
  updated_at: string;
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchServices = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar serviços:', error);
        toast({
          title: "Erro ao carregar serviços",
          description: "Ocorreu um erro ao buscar os serviços.",
          variant: "destructive",
        });
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'barbershop_id'>) => {
    if (!profile?.barbershop_id) return false;

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([
          {
            ...serviceData,
            barbershop_id: profile.barbershop_id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar serviço:', error);
        toast({
          title: "Erro ao adicionar serviço",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setServices(prev => [...prev, data]);
      toast({
        title: "Serviço adicionado",
        description: `${serviceData.name} foi adicionado com sucesso.`,
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao adicionar serviço:', error);
      toast({
        title: "Erro ao adicionar serviço",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateService = async (serviceId: string, serviceData: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar serviço:', error);
        toast({
          title: "Erro ao atualizar serviço",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setServices(prev => prev.map(service => 
        service.id === serviceId ? data : service
      ));
      
      toast({
        title: "Serviço atualizado",
        description: "As informações do serviço foram atualizadas com sucesso.",
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar serviço:', error);
      toast({
        title: "Erro ao atualizar serviço",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('Erro ao deletar serviço:', error);
        toast({
          title: "Erro ao deletar serviço",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setServices(prev => prev.filter(service => service.id !== serviceId));
      toast({
        title: "Serviço removido",
        description: "O serviço foi removido com sucesso.",
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao deletar serviço:', error);
      toast({
        title: "Erro ao deletar serviço",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    return await updateService(serviceId, { is_active: isActive });
  };

  useEffect(() => {
    fetchServices();
  }, [profile?.barbershop_id]);

  return {
    services,
    loading,
    addService,
    updateService,
    deleteService,
    toggleServiceStatus,
    refetchServices: fetchServices,
  };
};