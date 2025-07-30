import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, barbershopId } = await req.json();

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ 
        error: 'EvolutionAPI configuration not found' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      // Get barbershop info
      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id, name, slug')
        .eq('id', barbershopId)
        .single();

      if (!barbershop) {
        return new Response(JSON.stringify({ error: 'Barbershop not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create instance name from barbershop slug
      const instanceName = `barber_${barbershop.slug.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      try {
        // Create instance in EvolutionAPI
        const createResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            instanceName: instanceName,
            token: `token_${instanceName}`,
            qrcode: true,
            number: "",
            typebot: "",
            webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`,
            webhook_by_events: false,
            events: [
              "APPLICATION_STARTUP",
              "QRCODE_UPDATED",
              "CONNECTION_UPDATE",
              "MESSAGES_UPSERT",
              "MESSAGES_UPDATE",
              "SEND_MESSAGE"
            ]
          }),
        });

        const createResult = await createResponse.json();

        if (!createResponse.ok) {
          console.error('Evolution API Error:', createResult);
          return new Response(JSON.stringify({ 
            error: 'Failed to create instance in EvolutionAPI',
            details: createResult 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update database with instance info
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            instance_id: instanceName,
            instance_token: `token_${instanceName}`,
            evolution_instance_name: instanceName,
            api_type: 'evolution',
            status: 'disconnected',
            webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`
          })
          .eq('barbershop_id', barbershopId);

        if (updateError) {
          console.error('Database update error:', updateError);
        }

        return new Response(JSON.stringify({
          success: true,
          instance: createResult,
          instanceName: instanceName
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Error creating Evolution instance:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to create Evolution instance',
          details: error.message 
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