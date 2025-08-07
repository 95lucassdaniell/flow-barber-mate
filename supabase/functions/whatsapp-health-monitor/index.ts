import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting WhatsApp health monitoring...');

    // Get all active WhatsApp instances
    const { data: instances, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('api_type', 'evolution');

    if (fetchError) {
      throw new Error(`Failed to fetch instances: ${fetchError.message}`);
    }

    const healthResults = [];
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const globalApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    for (const instance of instances) {
      console.log(`Checking health for instance: ${instance.evolution_instance_name}`);
      
      const healthCheck = {
        barbershop_id: instance.barbershop_id,
        instance_name: instance.evolution_instance_name,
        db_status: instance.status,
        api_status: 'unknown',
        last_message_received: null,
        needs_reconnection: false,
        issues: []
      };

      try {
        // Check recent inbound messages
        const { data: recentMessages, error: msgError } = await supabase
          .from('whatsapp_messages')
          .select('created_at')
          .eq('barbershop_id', instance.barbershop_id)
          .eq('direction', 'inbound')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (!msgError && recentMessages.length > 0) {
          healthCheck.last_message_received = recentMessages[0].created_at;
        } else {
          healthCheck.issues.push('No inbound messages in last 24 hours');
        }

        // Check Evolution API connection state
        if (instance.evolution_instance_name) {
          const apiResponse = await fetch(
            `${evolutionUrl}/instance/connectionState/${instance.evolution_instance_name}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'apikey': globalApiKey,
              },
            }
          );

          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            healthCheck.api_status = apiData.instance?.state || 'unknown';
            
            // Update database with real status and phone number
            const updateData: any = {
              last_seen: new Date().toISOString()
            };

            if (apiData.instance?.state) {
              if (apiData.instance.state === 'open') {
                updateData.status = 'connected';
              } else if (apiData.instance.state === 'close') {
                updateData.status = 'disconnected';
                healthCheck.needs_reconnection = true;
                healthCheck.issues.push('Instance disconnected in Evolution API');
              }
            }

            if (apiData.instance?.phone) {
              updateData.phone_number = apiData.instance.phone;
            }

            await supabase
              .from('whatsapp_instances')
              .update(updateData)
              .eq('id', instance.id);

            console.log(`Evolution API response:`, JSON.stringify(apiData));
          } else {
            healthCheck.api_status = 'error';
            healthCheck.issues.push('Failed to connect to Evolution API');
          }
        }

        // Determine if reconnection is needed
        if (instance.status === 'connected' && healthCheck.api_status !== 'open') {
          healthCheck.needs_reconnection = true;
          healthCheck.issues.push('Database shows connected but API shows different state');
        }

        if (!instance.phone_number && instance.status === 'connected') {
          healthCheck.needs_reconnection = true;
          healthCheck.issues.push('No phone number but marked as connected');
        }

        // Auto-reconnect if needed
        if (healthCheck.needs_reconnection) {
          console.log(`Attempting auto-reconnection for ${instance.evolution_instance_name}`);
          
          try {
            const { error: reconnectError } = await supabase.functions.invoke(
              'whatsapp-reconnect',
              {
                body: { barbershopId: instance.barbershop_id }
              }
            );

            if (reconnectError) {
              healthCheck.issues.push(`Auto-reconnection failed: ${reconnectError.message}`);
            } else {
              healthCheck.issues.push('Auto-reconnection attempted');
            }
          } catch (reconnectError) {
            healthCheck.issues.push(`Auto-reconnection error: ${reconnectError.message}`);
          }
        }

      } catch (error) {
        console.error(`Health check error for ${instance.evolution_instance_name}:`, error);
        healthCheck.issues.push(`Health check error: ${error.message}`);
      }

      healthResults.push(healthCheck);
    }

    console.log('Health monitoring completed');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results: healthResults,
        summary: {
          total_instances: instances.length,
          healthy_instances: healthResults.filter(r => r.issues.length === 0).length,
          instances_needing_attention: healthResults.filter(r => r.issues.length > 0).length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in whatsapp-health-monitor:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});