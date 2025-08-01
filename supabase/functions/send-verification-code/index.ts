import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')!;
const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  phone: string;
  barbershopSlug: string;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  return `55${cleaned}`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, barbershopSlug }: VerificationRequest = await req.json();

    if (!phone || !barbershopSlug) {
      return new Response(
        JSON.stringify({ error: 'Phone and barbershop slug are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get barbershop by slug
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('id, name')
      .eq('slug', barbershopSlug)
      .single();

    if (barbershopError || !barbershop) {
      return new Response(
        JSON.stringify({ error: 'Barbershop not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: check recent attempts
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('phone_verification_codes')
      .select('id')
      .eq('phone', phone)
      .eq('barbershop_id', barbershop.id)
      .gte('created_at', tenMinutesAgo);

    if (recentAttempts && recentAttempts.length >= 3) {
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Tente novamente em 10 minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Save verification code
    const { error: saveError } = await supabase
      .from('phone_verification_codes')
      .insert({
        phone,
        code,
        barbershop_id: barbershop.id,
        expires_at: expiresAt
      });

    if (saveError) {
      console.error('Error saving verification code:', saveError);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get WhatsApp instance for this barbershop
    const { data: whatsappInstance } = await supabase
      .from('whatsapp_instances')
      .select('evolution_instance_name, instance_token')
      .eq('barbershop_id', barbershop.id)
      .eq('status', 'connected')
      .single();

    if (whatsappInstance?.instance_token) {
      try {
        const formattedPhone = formatPhoneNumber(phone);
        const message = `🔐 Seu código de verificação para ${barbershop.name} é: *${code}*\n\nO código expira em 5 minutos.\n\nSe você não solicitou este código, ignore esta mensagem.`;

        const whatsappResponse = await fetch(`${evolutionApiUrl}/message/sendText/${whatsappInstance.evolution_instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            number: formattedPhone,
            text: message
          })
        });

        if (!whatsappResponse.ok) {
          console.error('WhatsApp API error:', await whatsappResponse.text());
        }
      } catch (whatsappError) {
        console.error('Error sending WhatsApp message:', whatsappError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código de verificação enviado via WhatsApp',
        expiresIn: 300 // seconds
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-verification-code function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);