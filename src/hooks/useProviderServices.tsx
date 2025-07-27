import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ProviderService {
  id: string;
  provider_id: string;
  service_id: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  service?: {
    id: string;
    name: string;
    description?: string;
    duration_minutes: number;
  };
}

export interface ServiceWithPrice {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  is_active?: boolean;
}

export const useProviderServices = (providerId?: string) => {
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [allServices, setAllServices] = useState<ServiceWithPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Fetch all services from the barbershop
  const fetchAllServices = async () => {
    if (!profile?.barbershop_id) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAllServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Erro ao carregar serviços",
        description: "Não foi possível carregar os serviços disponíveis.",
        variant: "destructive",
      });
    }
  };

  // Fetch provider services
  const fetchProviderServices = async () => {
    if (!providerId || !profile?.barbershop_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('provider_services')
        .select(`
          *,
          service:services(id, name, description, duration_minutes)
        `)
        .eq('provider_id', providerId);

      if (error) throw error;
      setProviderServices(data || []);
    } catch (error) {
      console.error('Error fetching provider services:', error);
      toast({
        title: "Erro ao carregar serviços do prestador",
        description: "Não foi possível carregar os serviços do prestador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add or update provider service
  const saveProviderService = async (serviceId: string, price: number, isActive: boolean = true) => {
    if (!providerId) {
      console.error('No provider ID provided');
      return false;
    }

    console.log('Saving provider service:', { providerId, serviceId, price, isActive });

    try {
      // Validate inputs
      if (!serviceId) {
        throw new Error('ID do serviço é obrigatório.');
      }
      
      if (price < 0) {
        throw new Error('O preço não pode ser negativo.');
      }

      if (isActive && price === 0) {
        throw new Error('Serviços ativos devem ter um preço maior que zero.');
      }

      // Check if already exists
      const existingService = providerServices.find(ps => ps.service_id === serviceId);

      if (existingService) {
        console.log('Updating existing service:', existingService.id);
        // Update existing
        const { data, error } = await supabase
          .from('provider_services')
          .update({ price, is_active: isActive })
          .eq('id', existingService.id)
          .select(`
            *,
            service:services(id, name, description, duration_minutes)
          `)
          .single();

        if (error) {
          console.error('Supabase error updating provider service:', error);
          throw new Error(`Erro ao atualizar serviço: ${error.message}`);
        }

        setProviderServices(prev => 
          prev.map(ps => ps.id === existingService.id ? data : ps)
        );
      } else {
        console.log('Creating new service');
        // Create new
        const { data, error } = await supabase
          .from('provider_services')
          .insert({
            provider_id: providerId,
            service_id: serviceId,
            price,
            is_active: isActive
          })
          .select(`
            *,
            service:services(id, name, description, duration_minutes)
          `)
          .single();

        if (error) {
          console.error('Supabase error creating provider service:', error);
          throw new Error(`Erro ao criar serviço: ${error.message}`);
        }

        setProviderServices(prev => [...prev, data]);
      }

      console.log('Provider service saved successfully');
      toast({
        title: "Serviço salvo",
        description: "As configurações do serviço foram salvas com sucesso.",
      });

      return true;
    } catch (error: any) {
      console.error('Error saving provider service:', error);
      toast({
        title: "Erro ao salvar serviço",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove provider service
  const removeProviderService = async (serviceId: string) => {
    if (!providerId) {
      console.error('No provider ID provided');
      return false;
    }

    console.log('Removing provider service:', { providerId, serviceId });

    try {
      if (!serviceId) {
        throw new Error('ID do serviço é obrigatório.');
      }

      const existingService = providerServices.find(ps => ps.service_id === serviceId);
      if (!existingService) {
        console.log('Service not found in provider services');
        return false;
      }

      const { error } = await supabase
        .from('provider_services')
        .delete()
        .eq('id', existingService.id);

      if (error) {
        console.error('Supabase error removing provider service:', error);
        throw new Error(`Erro ao remover serviço: ${error.message}`);
      }

      setProviderServices(prev => prev.filter(ps => ps.id !== existingService.id));

      console.log('Provider service removed successfully');
      toast({
        title: "Serviço removido",
        description: "O serviço foi removido do prestador com sucesso.",
      });

      return true;
    } catch (error: any) {
      console.error('Error removing provider service:', error);
      toast({
        title: "Erro ao remover serviço",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Toggle provider service status
  const toggleProviderServiceStatus = async (serviceId: string, isActive: boolean) => {
    const existingService = providerServices.find(ps => ps.service_id === serviceId);
    if (!existingService) return false;

    return await saveProviderService(serviceId, existingService.price, isActive);
  };

  // Get services formatted for display
  const getServicesWithPrices = (): ServiceWithPrice[] => {
    return allServices.map(service => {
      const providerService = providerServices.find(ps => ps.service_id === service.id);
      return {
        ...service,
        price: providerService?.price,
        is_active: providerService?.is_active ?? false
      };
    });
  };

  useEffect(() => {
    fetchAllServices();
  }, [profile?.barbershop_id]);

  useEffect(() => {
    if (providerId) {
      fetchProviderServices();
    }
  }, [providerId]);

  return {
    providerServices,
    allServices,
    loading,
    saveProviderService,
    removeProviderService,
    toggleProviderServiceStatus,
    getServicesWithPrices,
    refetch: fetchProviderServices,
  };
};