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

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching barbershop by slug:', slug);

        const { data, error } = await supabase
          .from("barbershops")
          .select("id, name, logo_url")
          .eq("slug", slug)
          .single();

        if (error) throw error;

        // Cache the result for 5 minutes
        if (data) {
          cacheManager.set(cacheKey, data, 5 * 60 * 1000);
          console.log('✅ Barbershop data fetched and cached:', data.name);
        }

        setBarbershop(data);
      } catch (err: any) {
        console.error("Error fetching barbershop:", err);
        setError(err.message || "Erro ao carregar informações da barbearia");
      } finally {
        setLoading(false);
      }
    };

    fetchBarbershop();
  }, [slug]);

  return {
    barbershop,
    loading,
    error,
  };
};