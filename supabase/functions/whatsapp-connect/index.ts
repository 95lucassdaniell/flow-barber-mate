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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's barbershop
    const { data: profile } = await supabase
      .from('profiles')
      .select('barbershop_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.barbershop_id) {
      return new Response(JSON.stringify({ error: 'Barbershop not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get existing instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', profile.barbershop_id)
      .single();

    if (!instance) {
      return new Response(JSON.stringify({ error: 'WhatsApp instance not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    // Check if this is an Evolution API instance
    if (instance.api_type === 'evolution') {
      if (!evolutionApiUrl || !evolutionApiKey) {
        return new Response(JSON.stringify({ error: 'EvolutionAPI not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create instance if not exists
      if (!instance.evolution_instance_name) {
        const { data, error } = await supabase.functions.invoke('evolution-instance-manager', {
          body: { action: 'create', barbershopId: profile.barbershop_id }
        });

        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to create Evolution instance' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Get QR code from Evolution API
      try {
        const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instance.evolution_instance_name}`, {
          method: 'GET',
          headers: {
            'apikey': evolutionApiKey,
          },
        });

        const qrData = await qrResponse.json();
        
        if (qrData.base64) {
          // Update instance with QR code
          await supabase
            .from('whatsapp_instances')
            .update({
              qr_code: qrData.base64,
              status: 'connecting'
            })
            .eq('id', instance.id);

          return new Response(JSON.stringify({
            qr_code: qrData.base64,
            instance_id: instance.evolution_instance_name,
            status: 'connecting',
            api_type: 'evolution'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ 
            error: 'Failed to generate QR code',
            details: qrData 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('Evolution API QR Error:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to connect to Evolution API',
          details: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Legacy Z-API support
      const zapiToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
      if (!zapiToken) {
        return new Response(JSON.stringify({ error: 'Z-API token not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate instance ID and token if they don't exist
      if (!instance.instance_id || !instance.instance_token) {
        const instanceId = `barber_${profile.barbershop_id.replace(/-/g, '').substring(0, 8)}`;
        const instanceToken = `token_${Date.now()}`;
        
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({
            instance_id: instanceId,
            instance_token: instanceToken,
            status: 'connecting'
          })
          .eq('id', instance.id);

        if (updateError) {
          return new Response(JSON.stringify({ error: 'Failed to update instance' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        instance.instance_id = instanceId;
        instance.instance_token = instanceToken;
      }

      // Generate QR Code from Z-API
      try {
        const qrResponse = await fetch(`https://api.z-api.io/instances/${instance.instance_id}/token/${instance.instance_token}/qr-code`, {
          method: 'GET',
          headers: {
            'Client-Token': zapiToken
          }
        });

        const qrData = await qrResponse.json();
        
        if (qrData.value) {
          // Update instance with QR code
          await supabase
            .from('whatsapp_instances')
            .update({
              qr_code: qrData.value,
              status: 'connecting'
            })
            .eq('id', instance.id);

          return new Response(JSON.stringify({
            qr_code: qrData.value,
            instance_id: instance.instance_id,
            status: 'connecting',
            api_type: 'zapi'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ 
            error: 'Failed to generate QR code',
            details: qrData 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('Z-API QR Error:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to connect to Z-API',
          details: error.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (error) {
    console.error('Error in whatsapp-connect:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});