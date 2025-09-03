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
    console.log('=== WHATSAPP CONNECT STARTED ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('Getting user from auth...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    // Get user's barbershop
    console.log('Getting user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('barbershop_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ 
        error: 'Failed to get user profile',
        details: profileError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profile?.barbershop_id) {
      console.error('No barbershop found for user');
      return new Response(JSON.stringify({ error: 'Barbershop not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User barbershop ID:', profile.barbershop_id);

    // Get existing instance
    console.log('Getting WhatsApp instance...');
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', profile.barbershop_id)
      .single();

    if (instanceError) {
      console.error('Instance error:', instanceError);
      return new Response(JSON.stringify({ 
        error: 'Failed to get WhatsApp instance',
        details: instanceError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!instance) {
      console.error('No WhatsApp instance found for barbershop');
      return new Response(JSON.stringify({ error: 'WhatsApp instance not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('WhatsApp instance found:', { 
      id: instance.id, 
      api_type: instance.api_type,
      evolution_instance_name: instance.evolution_instance_name,
      instance_id: instance.instance_id,
      status: instance.status
    });

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    console.log('Environment check:', {
      evolutionApiUrl: evolutionApiUrl ? `${evolutionApiUrl.substring(0, 20)}...` : 'NOT SET',
      evolutionApiKey: evolutionApiKey ? 'SET' : 'NOT SET'
    });

    // Check if this is an Evolution API instance
    if (instance.api_type === 'evolution') {
      console.log('=== EVOLUTION API FLOW ===');
      
      if (!evolutionApiUrl || !evolutionApiKey) {
        console.error('Evolution API not configured');
        return new Response(JSON.stringify({ 
          error: 'EvolutionAPI not configured',
          details: {
            evolutionApiUrl: evolutionApiUrl ? 'SET' : 'MISSING',
            evolutionApiKey: evolutionApiKey ? 'SET' : 'MISSING'
          }
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create instance if not exists
      if (!instance.evolution_instance_name || !instance.instance_id) {
        console.log('Instance not properly configured, creating...');
        console.log('Current instance state:', {
          evolution_instance_name: instance.evolution_instance_name,
          instance_id: instance.instance_id,
          instance_token: instance.instance_token
        });
        
        console.log('Calling evolution-instance-manager...');
        const { data, error } = await supabase.functions.invoke('evolution-instance-manager', {
          body: { action: 'create', barbershopId: profile.barbershop_id }
        });

        console.log('Evolution instance manager response:', { data, error });

        if (error) {
          console.error('Failed to create Evolution instance:', error);
          return new Response(JSON.stringify({ 
            error: 'Failed to create Evolution instance',
            details: error 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!data?.success) {
          console.error('Evolution instance manager returned failure:', data);
          return new Response(JSON.stringify({ 
            error: 'Failed to create Evolution instance',
            details: data 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Refresh instance data
        console.log('Refreshing instance data...');
        const { data: updatedInstance, error: refreshError } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('barbershop_id', profile.barbershop_id)
          .single();

        if (refreshError) {
          console.error('Error refreshing instance:', refreshError);
          return new Response(JSON.stringify({ 
            error: 'Failed to refresh instance data',
            details: refreshError 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (updatedInstance) {
          console.log('Updated instance:', updatedInstance);
          Object.assign(instance, updatedInstance);
        }
      }

      // Check current connection state first to make this idempotent
      try {
        console.log('Checking Evolution API connection state for instance:', instance.evolution_instance_name);
        const stateRes = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance.evolution_instance_name}`, {
          method: 'GET',
          headers: { 'apikey': evolutionApiKey },
        });

        let stateJson: any = null;
        try {
          stateJson = await stateRes.json();
        } catch (_e) {
          console.warn('Could not parse connectionState response as JSON');
        }
        console.log('Evolution API connectionState response status:', stateRes.status);
        if (stateJson) console.log('Evolution API connectionState response:', JSON.stringify(stateJson));

        const currentState = stateJson?.instance?.state ?? stateJson?.state;
        if (stateRes.ok && (currentState === 'open' || currentState === 'CONNECTED' || currentState === 'connected')) {
          console.log('Instance already connected. Returning connected state.');
          // Ensure DB reflects connected state and clear any stale QR
          await supabase
            .from('whatsapp_instances')
            .update({ status: 'connected', qr_code: null })
            .eq('id', instance.id);

          return new Response(JSON.stringify({
            status: 'connected',
            connected: true,
            phone_number: stateJson?.instance?.user?.id ?? null,
            instance_id: instance.evolution_instance_name,
            api_type: 'evolution'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Not connected yet – request a QR code
        console.log('Requesting QR code from Evolution API...');
        const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instance.evolution_instance_name}`, {
          method: 'GET',
          headers: { 'apikey': evolutionApiKey },
        });

        if (!qrResponse.ok) {
          const errText = await qrResponse.text();
          console.error('Evolution API connect error:', qrResponse.status, errText);
          return new Response(JSON.stringify({
            error: 'Failed to generate QR code',
            details: { status: qrResponse.status, body: errText }
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let qrData: any = null;
        try {
          qrData = await qrResponse.json();
        } catch (e) {
          console.error('Failed to parse Evolution API QR response JSON:', e);
          return new Response(JSON.stringify({
            error: 'Invalid QR response from Evolution API'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        if (qrData?.base64) {
          // Update instance with QR code
          await supabase
            .from('whatsapp_instances')
            .update({ qr_code: qrData.base64, status: 'connecting' })
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
          console.error('QR data did not include base64 field:', qrData);
          return new Response(JSON.stringify({
            error: 'Failed to generate QR code',
            details: qrData
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('Evolution API flow error:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to connect to Evolution API',
          details: (error as Error).message 
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