import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Função para formatar telefone brasileiro
const formatPhone = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Se tem 11 dígitos (celular), formato: (XX) XXXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  // Se tem 10 dígitos (fixo), formato: (XX) XXXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  // Se não tem 10 ou 11 dígitos, retorna como está
  return phone;
};

// Função para validar formato de telefone
const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
};

interface BarbershopData {
  id: string;
  name: string;
  logo_url?: string;
}

interface ClientData {
  id: string;
  name: string;
  phone: string;
}

interface BarberData {
  id: string;
  full_name: string;
}

const PublicReviewPage: React.FC = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [barbershop, setBarbershop] = useState<BarbershopData | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [barber, setBarber] = useState<BarberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form data
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const clientId = searchParams.get('client');
  const barberId = searchParams.get('barber');
  const appointmentId = searchParams.get('appointment');

  useEffect(() => {
    const loadInitialData = async () => {
      if (!slug) return;

      try {
        // Load barbershop data
        const { data: barbershopData, error: barbershopError } = await supabase
          .from('barbershops')
          .select('id, name, logo_url')
          .eq('slug', slug)
          .eq('status', 'active')
          .single();

        if (barbershopError) throw barbershopError;
        setBarbershop(barbershopData);

        // Load client data if provided
        if (clientId && barbershopData) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('id, name, phone')
            .eq('id', clientId)
            .eq('barbershop_id', barbershopData.id)
            .single();

          if (clientData) {
            setClient(clientData);
            setCustomerName(clientData.name);
            setCustomerPhone(clientData.phone);
          }
        }

        // Load barber data if provided
        if (barberId && barbershopData) {
          const { data: barberData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', barberId)
            .eq('barbershop_id', barbershopData.id)
            .single();

          if (barberData) {
            setBarber(barberData);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar informações da barbearia.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [slug, clientId, barberId]);

  const handleSubmit = async () => {
    if (!barbershop || npsScore === null || !customerName.trim() || !customerPhone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu nome, telefone e dê uma nota de 0 a 10.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato do telefone
    if (!isValidPhone(customerPhone)) {
      toast({
        title: "Telefone inválido",
        description: "Por favor, digite um telefone válido com DDD (10 ou 11 dígitos).",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const formattedPhone = formatPhone(customerPhone);

      // Insert the review directly into public_client_reviews table
      const { error: reviewError } = await supabase
        .from('public_client_reviews')
        .insert([{
          barbershop_id: barbershop.id,
          barber_id: barberId || null,
          client_name: customerName.trim(),
          client_phone: formattedPhone,
          nps_score: npsScore,
          star_rating: rating || null,
          review_text: reviewText.trim() || null
        }]);

      if (reviewError) throw reviewError;

      setSubmitted(true);
      toast({
        title: "Obrigado!",
        description: "Sua avaliação foi registrada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar avaliação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!barbershop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Barbearia não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
            <p className="text-muted-foreground mb-4">
              Sua avaliação foi registrada com sucesso e nos ajuda a melhorar nossos serviços.
            </p>
            <p className="text-sm text-muted-foreground">
              Esperamos vê-lo novamente em breve na {barbershop.name}!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            {barbershop.logo_url && (
              <img 
                src={barbershop.logo_url} 
                alt={barbershop.name}
                className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
              />
            )}
            <CardTitle className="text-2xl">{barbershop.name}</CardTitle>
            <p className="text-muted-foreground">
              Como foi sua experiência conosco?
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Customer Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Seu nome *</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Digite seu nome"
                  disabled={!!client}
                />
              </div>
              
              {!client && (
                <div>
                  <label className="text-sm font-medium">Telefone *</label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setCustomerPhone(cleaned);
                    }}
                    placeholder="(11) 99999-9999"
                    maxLength={11}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite apenas números (DDD + telefone)
                  </p>
                </div>
              )}
            </div>

            {/* NPS Score */}
            <div>
              <label className="text-sm font-medium block mb-3">
                Qual a probabilidade de recomendar nossa barbearia? *
              </label>
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <Button
                    key={i}
                    variant={npsScore === i ? "default" : "outline"}
                    size="sm"
                    className="p-2 text-xs"
                    onClick={() => setNpsScore(i)}
                  >
                    {i}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Pouco provável</span>
                <span>Muito provável</span>
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="text-sm font-medium block mb-3">
                Avalie o atendimento (opcional)
              </label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={() => setRating(i + 1)}
                  >
                    <Star 
                      className={`w-6 h-6 ${
                        rating && rating > i 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted-foreground'
                      }`}
                    />
                  </Button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label className="text-sm font-medium">
                Comentários (opcional)
              </label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Deixe seus comentários sobre o atendimento..."
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              disabled={submitting || npsScore === null || !customerName.trim() || (!client && !customerPhone.trim())}
              className="w-full"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Enviar Avaliação
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicReviewPage;