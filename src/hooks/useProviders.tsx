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

export const useProviders = (barbershopId?: string) => {
  const { profile } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false); // Start with false

  // Resolve final barbershop ID
  const barbershopIdFinal = barbershopId || profile?.barbershop_id;

  useEffect(() => {
    // Enhanced logging for debugging
    console.log('🏪 useProviders barbershopId resolution:', {
      fromProfile: profile?.barbershop_id,
      fromSlug: barbershopId,
      final: barbershopIdFinal
    });
    
    // Safety timeout to prevent stuck loading
    const timeout = setTimeout(() => {
      console.log('⚠️ useProviders: Safety timeout reached, forcing loading false');
      setLoading(false);
    }, 3000);

    if (!barbershopIdFinal) {
      console.log('⚠️ useProviders: No barbershopId available yet, waiting...');
      setLoading(false); // Don't stay loading if no ID
      clearTimeout(timeout);
      return;
    }
    
    console.log(`🏪 useProviders: Starting fetch with barbershopId: ${barbershopIdFinal}`);
    fetchProviders();
    
    return () => clearTimeout(timeout);
  }, [barbershopIdFinal, profile?.barbershop_id]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      if (!barbershopIdFinal) {
        console.log('⚠️ fetchProviders: No barbershopIdFinal available');
        setLoading(false);
        return;
      }
      
      console.log(`🏪 fetchProviders: Using barbershopId: ${barbershopIdFinal} (source: ${barbershopId ? 'slug' : 'profile'})`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('barbershop_id', barbershopIdFinal)
        .in('role', ['barber', 'receptionist'])
        .order('full_name');
      
      if (error) {
        console.error('❌ fetchProviders error:', error);
        throw error;
      }
      
      console.log(`✅ fetchProviders: Loaded ${data?.length || 0} providers`);
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
    password?: string;
  }) => {
    try {
      console.log('Creating provider with data:', providerData);
      
      if (!barbershopIdFinal) {
        throw new Error('Perfil de usuário não encontrado ou barbearia não configurada.');
      }

      // Validate required fields
      if (!providerData.full_name?.trim()) {
        throw new Error('Nome completo é obrigatório.');
      }
      
      if (!providerData.email?.trim()) {
        throw new Error('Email é obrigatório.');
      }

      // Check if email already exists
      const { data: existingProvider, error: existingError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', providerData.email)
        .eq('barbershop_id', barbershopIdFinal)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing provider:', existingError);
        throw new Error('Erro ao verificar email existente.');
      }

      if (existingProvider) {
        throw new Error('Este email já está cadastrado para outro prestador.');
      }

      // Generate user_id and create provider
      const user_id = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const insertData = {
        ...providerData,
        barbershop_id: barbershopIdFinal,
        user_id: user_id,
        status: 'active',
        full_name: providerData.full_name.trim(),
        email: providerData.email.trim().toLowerCase(),
      };

      console.log('Inserting provider data:', insertData);

      const { data, error } = await supabase
        .from('profiles')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating provider:', error);
        if (error.code === '23505') {
          throw new Error('Este email já está em uso.');
        }
        throw new Error(`Erro ao criar prestador: ${error.message}`);
      }
      
      console.log('Provider created successfully:', data);
      
      // Create user in auth.users and set password
      if (data) {
        try {
          const password = providerData.password || 'vargas321';
          await supabase.rpc('set_provider_password', {
            provider_id: data.id,
            new_password: password
          });
        } catch (passwordError) {
          console.error('Error setting provider password:', passwordError);
          // Don't throw error here, provider was created successfully
        }
      }
      
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
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Você precisa estar logado para editar prestadores.');
      }

      console.log('Updating provider:', id, 'with updates:', updates);
      
      if (!id) {
        throw new Error('ID do prestador é obrigatório.');
      }

      // Validate email if being updated
      if (updates.email) {
        updates.email = updates.email.trim().toLowerCase();
        
        // Check if email already exists for other providers
        const { data: existingProvider, error: existingError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', updates.email)
          .eq('barbershop_id', barbershopIdFinal!)
          .neq('id', id)
          .single();

        if (existingError && existingError.code !== 'PGRST116') {
          console.error('Error checking existing provider email:', existingError);
          throw new Error('Erro ao verificar email existente.');
        }

        if (existingProvider) {
          throw new Error('Este email já está cadastrado para outro prestador.');
        }
      }

      // Validate and clean other fields
      if (updates.full_name) {
        updates.full_name = updates.full_name.trim();
        if (!updates.full_name) {
          throw new Error('Nome completo não pode estar vazio.');
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating provider:', error);
        
        // Handle specific RLS and authentication errors
        if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
          throw new Error('Prestador não encontrado ou você não tem permissão para editá-lo.');
        }
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          throw new Error('Você não tem permissão para editar este prestador.');
        }
        if (error.code === '23505') {
          throw new Error('Este email já está em uso.');
        }
        if (error.message?.includes('JWT')) {
          throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
        }
        
        throw new Error(`Erro ao atualizar prestador: ${error.message}`);
      }
      
      console.log('Provider updated successfully:', data);
      
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
      console.log('Toggling provider status:', id, 'to:', isActive);
      
      if (!id) {
        throw new Error('ID do prestador é obrigatório.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        console.error('Supabase error toggling provider status:', error);
        throw new Error(`Erro ao ${isActive ? 'ativar' : 'desativar'} prestador: ${error.message}`);
      }
      
      console.log('Provider status updated successfully');
      
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