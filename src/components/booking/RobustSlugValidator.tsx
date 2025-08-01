import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ValidatorProps {
  slug: string;
  onValidated: (isValid: boolean, barbershopData?: any) => void;
  children: React.ReactNode;
}

export const RobustSlugValidator = ({ slug, onValidated, children }: ValidatorProps) => {
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [barbershopData, setBarbershopData] = useState<any>(null);

  const validateSlug = async (attempt = 1) => {
    if (!slug) {
      setError('Slug não fornecido');
      onValidated(false);
      return;
    }

    try {
      console.log(`🔍 Validating slug "${slug}" (attempt ${attempt})`);
      
      // Test Supabase connection first
      const { data: connectionTest } = await supabase
        .from('barbershops')
        .select('count')
        .limit(1);
      
      if (!connectionTest) {
        throw new Error('Falha na conexão com o banco de dados');
      }

      // Validate the barbershop slug
      const { data, error: dbError } = await supabase
        .from('barbershops')
        .select('id, name, logo_url, slug')
        .eq('slug', slug)
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          setError(`Barbearia "${slug}" não encontrada`);
          onValidated(false);
          return;
        }
        throw dbError;
      }

      if (data) {
        console.log('✅ Barbershop validated:', data);
        setBarbershopData(data);
        setError(null);
        onValidated(true, data);
      } else {
        setError(`Barbearia "${slug}" não encontrada`);
        onValidated(false);
      }
    } catch (err: any) {
      console.error(`❌ Validation error (attempt ${attempt}):`, err);
      
      if (attempt < 3) {
        console.log(`🔄 Retrying validation in ${attempt * 1000}ms...`);
        setTimeout(() => {
          setRetryCount(attempt);
          validateSlug(attempt + 1);
        }, attempt * 1000);
      } else {
        setError(`Erro ao validar barbearia: ${err.message}`);
        onValidated(false);
      }
    } finally {
      if (attempt >= 3 || barbershopData) {
        setIsValidating(false);
      }
    }
  };

  useEffect(() => {
    setIsValidating(true);
    setError(null);
    setRetryCount(0);
    validateSlug(1);
  }, [slug]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            Validando barbearia...
            {retryCount > 0 && ` (tentativa ${retryCount + 1})`}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-6 max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Barbearia não encontrada</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};