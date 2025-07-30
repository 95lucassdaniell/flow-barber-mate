import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== EVOLUTION INSTANCE MANAGER RECEIVED REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('Returning CORS preflight response');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== EVOLUTION INSTANCE MANAGER STARTED ===');
    
    // Test environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');
    
    console.log('Environment variables check:');
    console.log('- SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET');
    console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'NOT SET');
    console.log('- EVOLUTION_API_URL:', evolutionApiUrl ? `${evolutionApiUrl.substring(0, 30)}...` : 'NOT SET');
    console.log('- EVOLUTION_GLOBAL_API_KEY:', evolutionApiKey ? 'SET' : 'NOT SET');
    
    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: parseError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { action, barbershopId } = requestBody;

    console.log('Extracted values:', {
      action,
      barbershopId
    });

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('CRITICAL: Evolution API environment variables not configured');
      return new Response(JSON.stringify({ 
        error: 'EvolutionAPI configuration not found',
        details: {
          evolutionApiUrl: evolutionApiUrl ? 'SET' : 'MISSING',
          evolutionApiKey: evolutionApiKey ? 'SET' : 'MISSING'
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      console.log('=== CREATE ACTION STARTED ===');
      
      // Get barbershop info
      console.log('Fetching barbershop info for ID:', barbershopId);
      const { data: barbershop, error: barbershopError } = await supabase
        .from('barbershops')
        .select('id, name, slug')
        .eq('id', barbershopId)
        .single();

      if (barbershopError) {
        console.error('Error fetching barbershop:', barbershopError);
        return new Response(JSON.stringify({ 
          error: 'Database error fetching barbershop',
          details: barbershopError 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!barbershop) {
        console.error('Barbershop not found for ID:', barbershopId);
        return new Response(JSON.stringify({ error: 'Barbershop not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Barbershop found:', barbershop);

      // Create instance name from barbershop slug
      const instanceName = `barber_${barbershop.slug.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      console.log('Generated instance name:', instanceName);

      try {
        const createPayload = {
          instanceName: instanceName,
          token: `token_${instanceName}`,
          qrcode: true,
          typebot: "",
          integration: "WHATSAPP-BAILEYS",
          webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`,
          webhookByEvents: false,
          events: [
            "APPLICATION_STARTUP",
            "QRCODE_UPDATED",
            "CONNECTION_UPDATE",
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "SEND_MESSAGE"
          ]
        };

        console.log('Creating Evolution API instance with payload:', JSON.stringify(createPayload, null, 2));
        console.log('Evolution API URL:', `${evolutionApiUrl}/instance/create`);

        // Create instance in EvolutionAPI
        const createResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify(createPayload),
        });

        console.log('Evolution API response status:', createResponse.status);
        console.log('Evolution API response headers:', Object.fromEntries(createResponse.headers.entries()));

        const createResult = await createResponse.json();
        console.log('Evolution API response body:', JSON.stringify(createResult, null, 2));

        if (!createResponse.ok) {
          console.error('Evolution API Error - Status:', createResponse.status);
          console.error('Evolution API Error - Body:', createResult);
          return new Response(JSON.stringify({ 
            error: 'Failed to create instance in EvolutionAPI',
            status: createResponse.status,
            details: createResult 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Evolution API instance created successfully!');

        // Update database with instance info
        console.log('Updating database with instance info...');
        const updateData = {
          instance_id: instanceName,
          instance_token: `token_${instanceName}`,
          evolution_instance_name: instanceName,
          api_type: 'evolution',
          status: 'disconnected',
          webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`
        };

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update(updateData)
          .eq('barbershop_id', barbershopId);

        if (updateError) {
          console.error('Database update error:', updateError);
          return new Response(JSON.stringify({ 
            error: 'Failed to update database with instance info',
            details: updateError 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Database updated successfully!');

        return new Response(JSON.stringify({
          success: true,
          instance: createResult,
          instanceName: instanceName,
          updated: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Error creating Evolution instance:', error);
        console.error('Error stack:', error.stack);
        return new Response(JSON.stringify({ 
          error: 'Failed to create Evolution instance',
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'delete') {
      // Get instance info
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('evolution_instance_name')
        .eq('barbershop_id', barbershopId)
        .single();

      if (!instance?.evolution_instance_name) {
        return new Response(JSON.stringify({ error: 'Instance not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        // Delete instance from EvolutionAPI
        const deleteResponse = await fetch(`${evolutionApiUrl}/instance/delete/${instance.evolution_instance_name}`, {
          method: 'DELETE',
          headers: {
            'apikey': evolutionApiKey,
          },
        });

        // Update database
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            status: 'disconnected',
            instance_id: null,
            instance_token: null,
            phone_number: null,
            qr_code: null
          })
          .eq('barbershop_id', barbershopId);

        if (updateError) {
          console.error('Database update error:', updateError);
        }

        return new Response(JSON.stringify({
          success: true,
          deleted: deleteResponse.ok
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Error deleting Evolution instance:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to delete Evolution instance',
          details: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in evolution-instance-manager:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});