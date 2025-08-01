import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

interface Provider {
  id: string;
  full_name: string;
}

interface ProviderService {
  provider_id: string;
  service_id: string;
  price: number;
  is_active: boolean;
}

interface Appointment {
  id: string;
  barber_id: string;
  start_time: string;
  end_time: string;
  appointment_date: string;
}

export const useBookingAvailability = (barbershopId: string) => {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (barbershopId) {
      fetchInitialData();
    }
  }, [barbershopId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name, duration_minutes')
        .eq('barbershop_id', barbershopId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      // Fetch providers (barbers)
      const { data: providersData, error: providersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('barbershop_id', barbershopId)
        .eq('role', 'barber')
        .eq('is_active', true);

      if (providersError) throw providersError;

      // Fetch provider services
      const { data: providerServicesData, error: providerServicesError } = await supabase
        .from('provider_services')
        .select('provider_id, service_id, price, is_active')
        .in('provider_id', providersData?.map(p => p.id) || [])
        .eq('is_active', true);

      if (providerServicesError) throw providerServicesError;

      setServices(servicesData || []);
      setProviders(providersData || []);
      setProviderServices(providerServicesData || []);
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableProviders = (serviceId: string) => {
    const serviceProviderIds = providerServices
      .filter(ps => ps.service_id === serviceId && ps.is_active)
      .map(ps => ps.provider_id);

    return providers.filter(provider => serviceProviderIds.includes(provider.id));
  };

  const getAvailableTimeSlots = async (
    date: Date,
    serviceId: string,
    providerId?: string
  ): Promise<string[]> => {
    try {
      const selectedDate = format(date, 'yyyy-MM-dd');
      
      // Get barbershop opening hours
      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('opening_hours')
        .eq('id', barbershopId)
        .single();

      if (!barbershop?.opening_hours) return [];

      const dayOfWeek = format(date, 'eeee').toLowerCase();
      const daySchedule = barbershop.opening_hours[dayOfWeek];
      
      if (!daySchedule || !daySchedule.open || !daySchedule.close) return [];

      // Get service duration
      const service = services.find(s => s.id === serviceId);
      if (!service) return [];

      // Get existing appointments for the date
      let appointmentsQuery = supabase
        .from('appointments')
        .select('barber_id, start_time, end_time')
        .eq('barbershop_id', barbershopId)
        .eq('appointment_date', selectedDate)
        .neq('status', 'cancelled');

      if (providerId) {
        appointmentsQuery = appointmentsQuery.eq('barber_id', providerId);
      } else {
        // Get all providers that can do this service
        const availableProviders = getAvailableProviders(serviceId);
        if (availableProviders.length === 0) return [];
        appointmentsQuery = appointmentsQuery.in('barber_id', availableProviders.map(p => p.id));
      }

      const { data: appointments } = await appointmentsQuery;

      // Generate time slots
      const slots: string[] = [];
      const startTime = new Date(`${selectedDate}T${daySchedule.open}:00`);
      const endTime = new Date(`${selectedDate}T${daySchedule.close}:00`);
      const slotDuration = 30; // minutes

      let currentTime = new Date(startTime);
      
      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + service.duration_minutes * 60000);
        
        // Check if service would end before closing time
        if (slotEnd <= endTime) {
          const timeSlot = format(currentTime, 'HH:mm');
          
          // Check if slot is available
          const isAvailable = !appointments?.some(apt => {
            const aptStart = new Date(`${selectedDate}T${apt.start_time}`);
            const aptEnd = new Date(`${selectedDate}T${apt.end_time}`);
            
            return (
              (currentTime >= aptStart && currentTime < aptEnd) ||
              (slotEnd > aptStart && slotEnd <= aptEnd) ||
              (currentTime <= aptStart && slotEnd >= aptEnd)
            );
          });

          if (isAvailable) {
            slots.push(timeSlot);
          }
        }
        
        currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
      }

      return slots;
    } catch (error) {
      console.error('Error getting available time slots:', error);
      return [];
    }
  };

  const getServicePrice = (serviceId: string, providerId?: string) => {
    if (providerId) {
      const providerService = providerServices.find(
        ps => ps.service_id === serviceId && ps.provider_id === providerId
      );
      if (providerService) return providerService.price;
    }
    
    // If no provider-specific price, get default price from provider_services
    const defaultProviderService = providerServices.find(ps => ps.service_id === serviceId);
    return defaultProviderService?.price || 0;
  };

  return {
    services,
    providers,
    isLoading,
    error,
    getAvailableProviders,
    getAvailableTimeSlots,
    getServicePrice,
    refetch: fetchInitialData
  };
};