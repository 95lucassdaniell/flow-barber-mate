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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting WhatsApp health monitoring...');

    // Get all active WhatsApp instances
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select(`
        id,
        barbershop_id,
        evolution_instance_name,
        status,
        last_connected_at,
        api_type,
        barbershops!inner(name, slug)
      `)
      .eq('api_type', 'evolution')
      .neq('status', 'pending_configuration');

    if (instancesError) {
      throw new Error(`Failed to get instances: ${instancesError.message}`);
    }

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Evolution API not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const instance of instances || []) {
      try {
        console.log(`Checking health for instance: ${instance.evolution_instance_name}`);

        // Check if instance hasn't received messages in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data: recentMessages } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('barbershop_id', instance.barbershop_id)
          .eq('direction', 'inbound')
          .gte('created_at', oneHourAgo)
          .limit(1);

        // Check actual status from Evolution API
        const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance.evolution_instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionApiKey
          }
        });

        let needsReconnection = false;
        let actualStatus = 'unknown';
        let phoneNumber = null;

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          actualStatus = statusData.instance?.state || 'unknown';
          phoneNumber = statusData.instance?.user?.id?.split('@')[0] || null;

          // Check if status is inconsistent
          if (actualStatus !== 'open' && instance.status === 'connected') {
            needsReconnection = true;
            console.log(`Instance ${instance.evolution_instance_name} shows as connected but API says ${actualStatus}`);
          }

          // Check if no messages received in last hour and was previously working
          if (actualStatus === 'open' && instance.status === 'connected' && (!recentMessages || recentMessages.length === 0)) {
            // Check if this instance ever received messages
            const { data: hasMessages } = await supabase
              .from('whatsapp_messages')
              .select('id')
              .eq('barbershop_id', instance.barbershop_id)
              .eq('direction', 'inbound')
              .limit(1);

            if (hasMessages && hasMessages.length > 0) {
              console.log(`Instance ${instance.evolution_instance_name} hasn't received messages in the last hour`);
              needsReconnection = true;
            }
          }
        } else {
          console.log(`Failed to check status for ${instance.evolution_instance_name}: ${statusResponse.status}`);
          if (instance.status === 'connected') {
            needsReconnection = true;
          }
        }

        // Update database status
        await supabase
          .from('whatsapp_instances')
          .update({
            status: actualStatus === 'open' ? 'connected' : actualStatus === 'close' ? 'disconnected' : actualStatus,
            phone_number: phoneNumber,
            last_connected_at: actualStatus === 'open' ? new Date().toISOString() : instance.last_connected_at
          })
          .eq('id', instance.id);

        // Attempt auto-reconnection if needed
        if (needsReconnection) {
          console.log(`Attempting auto-reconnection for ${instance.evolution_instance_name}`);
          
          try {
            // Call the reconnect function
            const reconnectResponse = await supabase.functions.invoke('whatsapp-reconnect', {
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              }
            });

            if (reconnectResponse.error) {
              console.error(`Auto-reconnection failed for ${instance.evolution_instance_name}:`, reconnectResponse.error);
            } else {
              console.log(`Auto-reconnection initiated for ${instance.evolution_instance_name}`);
            }
          } catch (reconnectError) {
            console.error(`Auto-reconnection error for ${instance.evolution_instance_name}:`, reconnectError);
          }
        }

        results.push({
          instance_name: instance.evolution_instance_name,
          barbershop: instance.barbershops?.name,
          previous_status: instance.status,
          actual_status: actualStatus,
          needs_reconnection: needsReconnection,
          recent_messages: recentMessages?.length || 0
        });

      } catch (error) {
        console.error(`Error checking instance ${instance.evolution_instance_name}:`, error);
        results.push({
          instance_name: instance.evolution_instance_name,
          barbershop: instance.barbershops?.name,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      checked_instances: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in whatsapp-health-monitor:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});