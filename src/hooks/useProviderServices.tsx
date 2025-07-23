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
    if (!providerId) return false;

    try {
      // Check if already exists
      const existingService = providerServices.find(ps => ps.service_id === serviceId);

      if (existingService) {
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

        if (error) throw error;

        setProviderServices(prev => 
          prev.map(ps => ps.id === existingService.id ? data : ps)
        );
      } else {
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

        if (error) throw error;

        setProviderServices(prev => [...prev, data]);
      }

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
    if (!providerId) return false;

    try {
      const existingService = providerServices.find(ps => ps.service_id === serviceId);
      if (!existingService) return false;

      const { error } = await supabase
        .from('provider_services')
        .delete()
        .eq('id', existingService.id);

      if (error) throw error;

      setProviderServices(prev => prev.filter(ps => ps.id !== existingService.id));

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