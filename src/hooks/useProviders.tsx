import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Provider {
  id: string;
  user_id: string | null;
  barbershop_id: string;
  role: 'admin' | 'receptionist' | 'barber';
  full_name: string;
  email: string;
  phone?: string;
  commission_rate?: number;
  is_active: boolean;
  status?: 'active' | 'pending';
  created_at: string;
  updated_at: string;
}

export const useProviders = () => {
  const { profile } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    fetchProviders();
  }, [profile]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      if (!profile?.barbershop_id) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .in('role', ['barber', 'receptionist'])
        .order('full_name');
      
      if (error) throw error;
      setProviders((data || []) as Provider[]);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProvider = async (providerData: {
    full_name: string;
    email: string;
    phone?: string;
    role: 'admin' | 'receptionist' | 'barber';
    commission_rate?: number;
    is_active: boolean;
  }) => {
    try {
      // Check if email already exists
      const { data: existingProvider } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', providerData.email)
        .eq('barbershop_id', profile!.barbershop_id)
        .single();

      if (existingProvider) {
        throw new Error('Este email já está cadastrado para outro prestador.');
      }

      // Create provider without user_id (pending status)
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          ...providerData,
          barbershop_id: profile!.barbershop_id,
          user_id: null, // Will be set when user accepts invitation
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Refetch providers to ensure UI is updated
      await fetchProviders();
      
      return data;
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  };

  const updateProvider = async (id: string, updates: Partial<Provider>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Refetch providers to ensure UI is updated
      await fetchProviders();
      
      return data;
    } catch (error) {
      console.error('Error updating provider:', error);
      throw error;
    }
  };

  const toggleProviderStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      
      // Refetch providers to ensure UI is updated
      await fetchProviders();
    } catch (error) {
      console.error('Error toggling provider status:', error);
      throw error;
    }
  };

  return {
    providers,
    loading,
    fetchProviders,
    createProvider,
    updateProvider,
    toggleProviderStatus,
  };
};