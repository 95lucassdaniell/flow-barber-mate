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

    const zapiToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
    if (!zapiToken) {
      return new Response(JSON.stringify({ error: 'Z-API token not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create or get existing instance
    let { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', profile.barbershop_id)
      .single();

    if (!instance) {
      // Create new instance
      const { data: newInstance, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          barbershop_id: profile.barbershop_id,
          status: 'disconnected'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating instance:', error);
        return new Response(JSON.stringify({ error: 'Failed to create instance' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      instance = newInstance;
    }

    // Generate unique instance identifier if not exists
    if (!instance.instance_id) {
      const instanceId = `barbershop_${profile.barbershop_id.replace(/-/g, '').substring(0, 8)}`;
      const instanceToken = `${zapiToken}_${instanceId}`;

      await supabase
        .from('whatsapp_instances')
        .update({
          instance_id: instanceId,
          instance_token: instanceToken,
          status: 'connecting'
        })
        .eq('id', instance.id);

      instance.instance_id = instanceId;
      instance.instance_token = instanceToken;
    }

    // Get QR Code from Z-API
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
          success: true,
          qr_code: qrData.value,
          instance_id: instance.instance_id,
          status: 'connecting'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.error('Z-API QR response:', qrData);
        return new Response(JSON.stringify({ error: 'Failed to generate QR code' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Z-API Error:', error);
      return new Response(JSON.stringify({ error: 'Z-API connection failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in whatsapp-connect:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});