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

    const { phone, barbershopSlug } = await req.json();

    console.log('=== GENERATE SESSION LINK STARTED ===');
    console.log('Request data:', { phone: phone?.substring(0, 5) + '***', barbershopSlug });

    if (!phone || !barbershopSlug) {
      return new Response(
        JSON.stringify({ error: 'Phone and barbershopSlug are required' }),
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

    // Store session token
    const { data: sessionToken, error: sessionError } = await supabase
      .from('session_tokens')
      .insert({
        session_id: sessionId,
        phone: phone,
        barbershop_slug: barbershopSlug,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session token:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Session token created successfully:', { sessionId });

    // Generate the full URL
    const baseUrl = req.headers.get('origin') || 'https://4a8a81eb-ccc4-4ce5-8add-647e06b5a87e.lovableproject.com';
    const sessionUrl = `${baseUrl}/${barbershopSlug}?session_id=${sessionId}`;

    console.log('Generated session URL:', sessionUrl);

    return new Response(
      JSON.stringify({
        success: true,
        sessionUrl,
        sessionId,
        expiresAt: sessionToken.expires_at
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-session-link:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});