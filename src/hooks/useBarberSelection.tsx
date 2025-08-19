import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBarbershopBySlug } from './useBarbershopBySlug';
import { useParams } from 'react-router-dom';
import { globalState } from '@/lib/globalState';

interface Barber {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export const useBarberSelection = () => {
  const { profile, canManageAll } = useAuth();
  const { slug } = useParams();
  const { barbershop: barbershopBySlug } = useBarbershopBySlug(slug || '');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use barbershop_id from profile or fallback to barbershop from slug
    const barbershopId = profile?.barbershop_id || barbershopBySlug?.id;
    if (!barbershopId) {
      console.log('⏳ Aguardando barbershop_id ou dados do slug para carregar barbeiros...');
      return;
    }

    let mounted = true;

    // Timeout de segurança para loading
    globalState.setOperationTimeout('barber-selection-loading', () => {
      if (mounted) {
        setLoading(false);
        console.warn('useBarberSelection: Loading timeout - forçando false');
      }
    }, 2000);

    const fetchBarbers = async () => {
      try {
        console.log('👥 Fetching barbers for barbershop:', barbershopId);
        
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, role, is_active')
          .eq('barbershop_id', barbershopId)
          .eq('is_active', true)
          .eq('role', 'barber')
          .order('full_name');

        if (!mounted) return;

        setBarbers(data || []);
        console.log('✅ Barbers loaded:', data?.length || 0);

        // Auto-select barber based on role
        if (!canManageAll && profile) {
          // If user is a barber, auto-select themselves
          setSelectedBarberId(profile.id);
        } else {
          // For admin/receptionist, load from localStorage or select first barber
          const saved = localStorage.getItem('selectedBarberId');
          if (saved && data?.some(b => b.id === saved)) {
            setSelectedBarberId(saved);
          } else if (data?.length) {
            setSelectedBarberId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching barbers:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          globalState.clearOperationTimeout('barber-selection-loading');
        }
      }
    };

    fetchBarbers();

    return () => {
      mounted = false;
      globalState.clearOperationTimeout('barber-selection-loading');
    };
  }, [profile, canManageAll, barbershopBySlug?.id]);

  const handleBarberChange = (barberId: string) => {
    if (!canManageAll && barberId !== profile?.id) {
      return; // Barber can only select themselves
    }
    
    setSelectedBarberId(barberId);
    
    // Save selection for admin/receptionist
    if (canManageAll) {
      localStorage.setItem('selectedBarberId', barberId);
    }
  };

  const selectedBarber = barbers.find(b => b.id === selectedBarberId);

  return {
    barbers,
    selectedBarberId,
    selectedBarber,
    handleBarberChange,
    canChangeBarber: canManageAll,
    loading
  };
};