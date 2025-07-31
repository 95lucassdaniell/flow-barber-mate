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
    const fetchBarbershop = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `barbershop-${slug}`;
      const cached = cacheManager.get<BarbershopInfo>(cacheKey);
      
      if (cached) {
        console.log('🚀 Using cached barbershop data for:', slug);
        setBarbershop(cached);
        setLoading(false);
        return;
      }

      let retryCount = 0;
      const maxRetries = 3;

      const attemptFetch = async (attempt = 0): Promise<void> => {
        try {
          setLoading(true);
          setError(null);

          console.log(`🔍 Fetching barbershop by slug: ${slug} (tentativa ${attempt + 1}/${maxRetries})`);

          const { data, error } = await supabase
            .from("barbershops")
            .select("id, name, logo_url")
            .eq("slug", slug)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              // No rows returned
              throw new Error('Barbearia não encontrada');
            }
            throw error;
          }

          // Cache the result for 5 minutes
          if (data) {
            cacheManager.set(cacheKey, data, 5 * 60 * 1000);
            console.log('✅ Barbershop data fetched and cached:', data.name);
          }

          setBarbershop(data);
          setLoading(false);
        } catch (err: any) {
          console.error(`Error fetching barbershop (attempt ${attempt + 1}):`, err);
          
          if (attempt < maxRetries - 1) {
            // Retry com delay exponencial
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            console.log(`🔄 Tentando novamente em ${delay}ms...`);
            setTimeout(() => attemptFetch(attempt + 1), delay);
          } else {
            console.error('🚫 Máximo de tentativas excedido para buscar barbearia');
            setError(err.message || "Erro ao carregar informações da barbearia");
            setLoading(false);
          }
        }
      };

      attemptFetch();
    };

    fetchBarbershop();
  }, [slug]);

  return {
    barbershop,
    loading,
    error,
  };
};