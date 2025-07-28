import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("barbershops")
          .select("id, name, logo_url")
          .eq("slug", slug)
          .single();

        if (error) throw error;

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