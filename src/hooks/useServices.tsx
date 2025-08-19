import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
  barbershop_id: string;
  created_at: string;
  updated_at: string;
}

export const useServices = (barbershopId?: string) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const barbershopIdFinal = barbershopId || profile?.barbershop_id;

  const fetchServices = async () => {
    if (!barbershopIdFinal) {
      console.log('⚠️ useServices: No barbershopId available yet, waiting...');
      setLoading(false);
      return;
    }

    try {
      console.log(`🏪 useServices: Starting fetch with barbershopId: ${barbershopIdFinal}`);
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', barbershopIdFinal)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ useServices error:', error);
        toast({
          title: "Erro ao carregar serviços",
          description: "Ocorreu um erro ao buscar os serviços.",
          variant: "destructive",
        });
        return;
      }

      console.log(`✅ useServices: Loaded ${data?.length || 0} services`);
      setServices(data || []);
    } catch (error) {
      console.error('❌ useServices unexpected error:', error);
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
    if (!barbershopIdFinal) {
      toast({
        title: "Barbearia não resolvida",
        description: "Ainda estamos resolvendo a barbearia. Tente novamente em instantes.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .insert([
          {
            ...serviceData,
            barbershop_id: barbershopIdFinal,
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

      // Refetch services to ensure UI is updated
      await fetchServices();
      
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

      // Refetch services to ensure UI is updated
      await fetchServices();
      
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

      // Refetch services to ensure UI is updated
      await fetchServices();
      
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
    const timeout = setTimeout(() => {
      console.log('⚠️ useServices: Safety timeout reached, forcing loading false');
      setLoading(false);
    }, 3000);

    if (!barbershopIdFinal) {
      console.log('⚠️ useServices: No barbershopId available yet, waiting...');
      setLoading(false);
      clearTimeout(timeout);
      return;
    }

    fetchServices();
    return () => clearTimeout(timeout);
  }, [barbershopIdFinal]);

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