import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface BarbershopSlugData {
  slug: string;
}

export const useBarbershopSlug = () => {
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchBarbershopSlug = async () => {
      if (!profile?.barbershop_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from('barbershops')
          .select('slug')
          .eq('id', profile.barbershop_id)
          .single();

        if (queryError) {
          throw queryError;
        }

        setSlug(data?.slug || null);
      } catch (err) {
        console.error('Error fetching barbershop slug:', err);
        setError('Erro ao buscar dados da barbearia');
      } finally {
        setLoading(false);
      }
    };

    fetchBarbershopSlug();
  }, [profile?.barbershop_id]);

  return {
    slug,
    loading,
    error,
  };
};