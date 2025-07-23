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

    // Get instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', profile.barbershop_id)
      .single();

    if (!instance) {
      return new Response(JSON.stringify({ 
        status: 'disconnected',
        connected: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const zapiToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
    if (!zapiToken || !instance.instance_id || !instance.instance_token) {
      return new Response(JSON.stringify({ 
        status: 'disconnected',
        connected: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check status from Z-API
    try {
      const statusResponse = await fetch(`https://api.z-api.io/instances/${instance.instance_id}/token/${instance.instance_token}/status`, {
        method: 'GET',
        headers: {
          'Client-Token': zapiToken
        }
      });

      const statusData = await statusResponse.json();
      
      let newStatus = 'disconnected';
      let phoneNumber = null;
      let connected = false;

      if (statusData.connected === true) {
        newStatus = 'connected';
        connected = true;
        phoneNumber = statusData.phone || null;
      } else if (statusData.connected === false) {
        newStatus = 'disconnected';
      }

      // Update instance status
      await supabase
        .from('whatsapp_instances')
        .update({
          status: newStatus,
          phone_number: phoneNumber,
          last_connected_at: connected ? new Date().toISOString() : instance.last_connected_at
        })
        .eq('id', instance.id);

      return new Response(JSON.stringify({
        status: newStatus,
        connected,
        phone_number: phoneNumber,
        instance_id: instance.instance_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Z-API Status Error:', error);
      return new Response(JSON.stringify({ 
        status: 'error',
        connected: false,
        error: 'Failed to check status' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in whatsapp-status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});