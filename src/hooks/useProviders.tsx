import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Provider {
  id: string;
  user_id: string;
  barbershop_id: string;
  role: 'admin' | 'receptionist' | 'barber';
  full_name: string;
  email: string;
  phone?: string;
  commission_rate?: number;
  is_active: boolean;
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
      console.log('useProviders - fetchProviders started, profile:', profile);
      
      if (!profile?.barbershop_id) {
        console.log('useProviders - No barbershop_id found in profile');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .order('full_name');

      console.log('useProviders - Supabase response:', { data, error });
      
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
      // In a real implementation, you would:
      // 1. Create a user in auth.users via edge function
      // 2. Insert into profiles table
      // For now, we'll simulate with just the profiles table
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          ...providerData,
          barbershop_id: profile!.barbershop_id,
          user_id: 'temp-' + Date.now(), // Temporary, should be real user_id from auth
        }])
        .select()
        .single();

      if (error) throw error;
      
      setProviders(prev => [...prev, data as Provider]);
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
      
      setProviders(prev => prev.map(p => p.id === id ? data as Provider : p));
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
      
      setProviders(prev => prev.map(p => 
        p.id === id ? { ...p, is_active: isActive } : p
      ));
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