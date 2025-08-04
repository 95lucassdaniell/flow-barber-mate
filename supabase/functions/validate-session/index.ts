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

    const { sessionId } = await req.json();

    console.log('=== VALIDATE SESSION STARTED ===');
    console.log('Request data:', { sessionId });

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find and validate session token
    const { data: sessionToken, error: sessionError } = await supabase
      .from('session_tokens')
      .select('*')
      .eq('session_id', sessionId)
      .gte('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (sessionError || !sessionToken) {
      console.log('Session not found or expired:', sessionError);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Session not found or expired' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Valid session found:', { 
      phone: sessionToken.phone?.substring(0, 5) + '***', 
      barbershopSlug: sessionToken.barbershop_slug 
    });

    // Get barbershop data
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('id, name, slug')
      .eq('slug', sessionToken.barbershop_slug)
      .single();

    if (barbershopError || !barbershop) {
      console.error('Barbershop not found:', barbershopError);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Barbershop not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find or create client
    let { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', sessionToken.phone)
      .eq('barbershop_id', barbershop.id)
      .single();

    if (clientError && clientError.code === 'PGRST116') {
      // Client doesn't exist, create one
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          phone: sessionToken.phone,
          name: 'Cliente', // Default name, can be updated later
          barbershop_id: barbershop.id
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating client:', createError);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'Failed to create client' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      client = newClient;
      console.log('New client created:', { id: client.id, phone: client.phone?.substring(0, 5) + '***' });
    } else if (clientError) {
      console.error('Error finding client:', clientError);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Database error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mark session as used
    await supabase
      .from('session_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('session_id', sessionId);

    console.log('Session validated successfully');

    return new Response(
      JSON.stringify({
        valid: true,
        client: {
          id: client.id,
          name: client.name,
          phone: client.phone,
          barbershop_id: client.barbershop_id
        },
        barbershop: {
          id: barbershop.id,
          name: barbershop.name,
          slug: barbershop.slug
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in validate-session:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});