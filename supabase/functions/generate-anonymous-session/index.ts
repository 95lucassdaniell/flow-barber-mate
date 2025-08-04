import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { barbershopSlug } = await req.json();

    console.log('=== GENERATE ANONYMOUS SESSION STARTED ===');
    console.log('Request data:', { barbershopSlug });

    if (!barbershopSlug) {
      return new Response(
        JSON.stringify({ error: 'BarbershopSlug is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify barbershop exists
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('id, name')
      .eq('slug', barbershopSlug)
      .single();

    if (barbershopError || !barbershop) {
      console.error('Barbershop not found:', barbershopError);
      return new Response(
        JSON.stringify({ error: 'Barbershop not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Barbershop found:', { id: barbershop.id, name: barbershop.name });

    // Generate unique session ID
    const sessionId = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    // Store anonymous session token with a generic phone number
    const { data: sessionToken, error: sessionError } = await supabase
      .from('session_tokens')
      .insert({
        session_id: sessionId,
        phone: 'anonymous_visitor', // Temporary anonymous identifier
        barbershop_slug: barbershopSlug,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating anonymous session token:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create anonymous session' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Anonymous session token created successfully:', { sessionId });

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        expiresAt: sessionToken.expires_at,
        isAnonymous: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-anonymous-session:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});