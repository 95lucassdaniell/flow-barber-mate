import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cacheManager } from "@/lib/globalState";

interface BarbershopInfo {
  id: string;
  name: string;
  logo_url: string | null;
}

export const useBarbershopBySlug = (slug: string) => {
  const [barbershop, setBarbershop] = useState<BarbershopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const maxRetries = 5;

    const fetchBarbershop = async (attempt = 0): Promise<void> => {
      try {
        console.log(`🏪 Fetching barbershop: ${slug} (tentativa ${attempt + 1}/${maxRetries})`);
        
        // Check cache first
        const cacheKey = `barbershop-${slug}`;
        const cached = cacheManager.get<BarbershopInfo>(cacheKey);
        
        if (cached && mounted) {
          console.log('🏪 Barbershop carregada do cache:', cached.name);
          setBarbershop(cached);
          setLoading(false);
          return;
        }

        // Public query - não depende de autenticação  
        const { data, error } = await supabase
          .from("barbershops")
          .select("id, name, logo_url")
          .eq("slug", slug)
          .maybeSingle(); // Use maybeSingle instead of single

        if (error) {
          console.error('❌ Barbershop fetch error:', error);
          throw error;
        }

        if (data && mounted) {
          const barbershopData = data as BarbershopInfo;
          console.log('✅ Barbershop carregada:', barbershopData.name);
          setBarbershop(barbershopData);
          cacheManager.set(cacheKey, barbershopData, 10 * 60 * 1000); // 10 min cache
          setError(null);
        } else if (mounted) {
          console.log('⚠️ Barbershop não encontrada para slug:', slug);
          setError('Barbearia não encontrada');
        }
      } catch (err: any) {
        console.error(`❌ Erro na tentativa ${attempt + 1}:`, err);
        
        if (attempt < maxRetries - 1 && mounted) {
          // Immediate retry for first few attempts
          const delay = attempt < 2 ? 200 : Math.pow(2, attempt - 2) * 1000;
          console.log(`🔄 Retry barbershop em ${delay}ms...`);
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

    // Immediate fetch - barbershop data should always be available
    fetchBarbershop();

    return () => {
      mounted = false;
    };
  }, [slug]);

  return {
    barbershop,
    loading,
    error,
  };
};