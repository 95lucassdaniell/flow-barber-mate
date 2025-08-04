import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  phone: string;
  code: string;
  barbershopSlug: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code, barbershopSlug }: VerifyRequest = await req.json();

    if (!phone || !code || !barbershopSlug) {
      return new Response(
        JSON.stringify({ error: 'Phone, code and barbershop slug are required' }),
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

    // Find valid verification code
    const { data: verificationCodes, error: codeError } = await supabase
      .from('phone_verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('barbershop_id', barbershop.id)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (codeError || !verificationCodes || verificationCodes.length === 0) {
      // Increment attempts for rate limiting
      await supabase.rpc('increment_verification_attempts', {
        phone_input: phone,
        barbershop_id_input: barbershop.id
      });

      return new Response(
        JSON.stringify({ error: 'Código inválido ou expirado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark code as verified
    const { error: updateError } = await supabase
      .from('phone_verification_codes')
      .update({ verified: true })
      .eq('id', verificationCodes[0].id);

    if (updateError) {
      console.error('Error updating verification code:', updateError);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if client exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', phone)
      .eq('barbershop_id', barbershop.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        client: existingClient || null,
        barbershop: barbershop
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-phone-code function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);