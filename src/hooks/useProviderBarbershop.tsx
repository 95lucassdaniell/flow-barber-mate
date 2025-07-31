import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cacheManager } from "@/lib/globalState";
import { useProviderAuth } from "@/hooks/useProviderAuth";

interface BarbershopInfo {
  id: string;
  name: string;
  logo_url: string | null;
}

export const useProviderBarbershop = () => {
  const [barbershop, setBarbershop] = useState<BarbershopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProviderAuth();

  useEffect(() => {
    if (!profile?.barbershop_id) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const maxRetries = 3;

    const fetchBarbershop = async (attempt = 0): Promise<void> => {
      try {
        console.log(`🏪 Fetching provider barbershop: ${profile.barbershop_id} (tentativa ${attempt + 1}/${maxRetries})`);
        
        // Check cache first
        const cacheKey = `provider-barbershop-${profile.barbershop_id}`;
        const cached = cacheManager.get<BarbershopInfo>(cacheKey);
        
        if (cached && mounted) {
          console.log('🏪 Provider barbershop carregada do cache:', cached.name);
          setBarbershop(cached);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("barbershops")
          .select("id, name, logo_url")
          .eq("id", profile.barbershop_id)
          .maybeSingle();

        if (error) {
          console.error('❌ Provider barbershop fetch error:', error);
          throw error;
        }

        if (data && mounted) {
          const barbershopData = data as BarbershopInfo;
          console.log('✅ Provider barbershop carregada:', barbershopData.name);
          setBarbershop(barbershopData);
          cacheManager.set(cacheKey, barbershopData, 10 * 60 * 1000); // 10 min cache
          setError(null);
        } else if (mounted) {
          console.log('⚠️ Provider barbershop não encontrada:', profile.barbershop_id);
          setError('Barbearia não encontrada');
        }
      } catch (err: any) {
        console.error(`❌ Erro na tentativa ${attempt + 1}:`, err);
        
        if (attempt < maxRetries - 1 && mounted) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`🔄 Retry provider barbershop em ${delay}ms...`);
          setTimeout(() => fetchBarbershop(attempt + 1), delay);
        } else if (mounted) {
          setError(err.message || "Erro ao carregar informações da barbearia");
        }
      } finally {
        if (mounted && (attempt >= maxRetries - 1 || barbershop || error)) {
          setLoading(false);
        }
      }
    };

    fetchBarbershop();

    return () => {
      mounted = false;
    };
  }, [profile?.barbershop_id]);

  return {
    barbershop,
    loading,
    error,
  };
};