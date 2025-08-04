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
  console.log('=== SEND VERIFICATION CODE STARTED ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, barbershopSlug }: VerificationRequest = await req.json();
    console.log('Request data:', { phone: phone?.substring(0, 5) + '***', barbershopSlug });

    if (!phone || !barbershopSlug) {
      console.error('Missing required fields:', { phone: !!phone, barbershopSlug: !!barbershopSlug });
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

    console.log('Barbershop lookup:', { barbershop, error: barbershopError });

    if (barbershopError || !barbershop) {
      console.error('Barbershop not found:', barbershopError);
      return new Response(
        JSON.stringify({ error: 'Barbershop not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up expired codes first
    await supabase.rpc('cleanup_expired_verification_codes');

    // Rate limiting: check recent attempts (only non-expired codes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('phone_verification_codes')
      .select('id, created_at, expires_at')
      .eq('phone', phone)
      .eq('barbershop_id', barbershop.id)
      .gte('created_at', tenMinutesAgo)
      .gt('expires_at', new Date().toISOString()); // Only non-expired codes

    console.log('Rate limiting check:', { recentAttempts: recentAttempts?.length || 0 });

    if (recentAttempts && recentAttempts.length >= 3) {
      console.log('Rate limit exceeded for phone:', phone.substring(0, 5) + '***');
      return new Response(
        JSON.stringify({ 
          error: 'Muitas tentativas. Tente novamente em 10 minutos.',
          retryAfter: 600 // seconds
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Save verification code
    console.log('Saving verification code for phone:', phone.substring(0, 5) + '***');
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

    console.log('Verification code saved successfully');

    // Get WhatsApp instance for this barbershop
    console.log('Looking for WhatsApp instance for barbershop:', barbershop.id);
    const { data: whatsappInstance, error: whatsappError } = await supabase
      .from('whatsapp_instances')
      .select('evolution_instance_name, instance_token, status')
      .eq('barbershop_id', barbershop.id)
      .eq('status', 'connected')
      .single();

    console.log('WhatsApp instance lookup:', { 
      found: !!whatsappInstance, 
      status: whatsappInstance?.status,
      hasToken: !!whatsappInstance?.instance_token,
      error: whatsappError 
    });

    let whatsappSent = false;
    let whatsappError_details = null;

    if (whatsappInstance?.instance_token) {
      try {
        console.log('Attempting to send WhatsApp message...');
        const formattedPhone = formatPhoneNumber(phone);
        const message = `🔐 Seu código de verificação para ${barbershop.name} é: *${code}*\n\nO código expira em 5 minutos.\n\nSe você não solicitou este código, ignore esta mensagem.`;

        console.log('Sending to phone:', formattedPhone.substring(0, 7) + '***');
        
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

        if (whatsappResponse.ok) {
          console.log('WhatsApp message sent successfully');
          whatsappSent = true;
        } else {
          const errorText = await whatsappResponse.text();
          console.error('WhatsApp API error:', errorText);
          whatsappError_details = errorText;
        }
      } catch (whatsappSendError) {
        console.error('Error sending WhatsApp message:', whatsappSendError);
        whatsappError_details = whatsappSendError.message;
      }
    } else {
      console.log('No WhatsApp instance found or not connected');
      whatsappError_details = 'WhatsApp not configured or disconnected';
    }

    // Always return success if code was saved, even if WhatsApp failed
    const responseMessage = whatsappSent 
      ? 'Código de verificação enviado via WhatsApp'
      : 'Código de verificação gerado. Se configurado, foi enviado via WhatsApp.';

    console.log('Returning response:', { 
      success: true, 
      whatsappSent, 
      whatsappError: whatsappError_details 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: responseMessage,
        whatsappSent,
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