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

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get user's barbershop
    const { data: profile } = await supabase
      .from('profiles')
      .select('barbershop_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.barbershop_id) {
      throw new Error('User barbershop not found');
    }

    const barbershopId = profile.barbershop_id;

    console.log(`Starting WhatsApp status check for barbershop: ${barbershopId}`);

    // Get current instance
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch instance: ${fetchError.message}`);
    }

    if (!instance.evolution_instance_name) {
      throw new Error('No Evolution instance name found');
    }

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const globalApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    // First, always check the real status in Evolution API
    console.log(`Checking real status for instance: ${instance.evolution_instance_name}`);
    
    try {
      const stateResponse = await fetch(
        `${evolutionUrl}/instance/connectionState/${instance.evolution_instance_name}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': globalApiKey,
          },
        }
      );

      if (stateResponse.ok) {
        const stateData = await stateResponse.json();
        const isConnected = stateData.instance?.state === 'open';
        
        console.log(`Instance real status: ${stateData.instance?.state}, connected: ${isConnected}`);
        
        // If already connected, just update database and return
        if (isConnected) {
          await supabase
            .from('whatsapp_instances')
            .update({
              status: 'connected',
              phone_number: stateData.instance.phone || null,
              qr_code: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', instance.id);

          return new Response(
            JSON.stringify({
              success: true,
              status: 'connected',
              phone_number: stateData.instance.phone || null,
              message: 'Instance is already connected, status synchronized'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
      } else if (stateResponse.status === 404) {
        console.log('Instance not found in Evolution API, will recreate');
      } else {
        console.log(`Status check failed with ${stateResponse.status}, proceeding with reconnection`);
      }
    } catch (statusError) {
      console.log(`Status check error: ${statusError.message}, proceeding with reconnection`);
    }

    // Only proceed with reconnection if instance is not connected
    console.log(`Attempting to reconnect instance: ${instance.evolution_instance_name}`);
    
    // Try to restart the instance first
    try {
      const restartResponse = await fetch(
        `${evolutionUrl}/instance/restart/${instance.evolution_instance_name}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': globalApiKey,
          },
        }
      );

      if (restartResponse.ok) {
        console.log('Instance restart successful');
        
        // Update status to connecting
        await supabase
          .from('whatsapp_instances')
          .update({
            status: 'connecting',
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);

        // Wait a bit and check connection state
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const stateResponse = await fetch(
          `${evolutionUrl}/instance/connectionState/${instance.evolution_instance_name}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': globalApiKey,
            },
          }
        );

        if (stateResponse.ok) {
          const stateData = await stateResponse.json();
          const status = stateData.instance?.state === 'open' ? 'connected' : 'connecting';
          
          await supabase
            .from('whatsapp_instances')
            .update({
              status,
              phone_number: stateData.instance?.phone || null,
              qr_code: status === 'connecting' ? stateData.qrcode : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', instance.id);

          return new Response(
            JSON.stringify({
              success: true,
              status,
              phone_number: stateData.instance?.phone || null,
              qr_code: status === 'connecting' ? stateData.qrcode : null,
              message: 'Instance restart completed'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
      } else if (restartResponse.status === 404) {
        console.log('Instance not found for restart, will recreate');
      }
    } catch (restartError) {
      console.log(`Restart failed: ${restartError.message}`);
    }

    // If restart failed or instance doesn't exist, recreate
    console.log('Recreating instance');

    // Try to delete existing instance first (if any)
    try {
      await fetch(
        `${evolutionUrl}/instance/delete/${instance.evolution_instance_name}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': globalApiKey,
          },
        }
      );
      console.log('Old instance deleted');
    } catch (deleteError) {
      console.log(`Delete failed (expected if instance doesn't exist): ${deleteError.message}`);
    }

    // Create new instance
    console.log(`Creating new instance: ${instance.evolution_instance_name}`);
    
    const createResponse = await fetch(
      `${evolutionUrl}/instance/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': globalApiKey,
        },
        body: JSON.stringify({
          instanceName: instance.evolution_instance_name,
          webhook: instance.webhook_url,
          events: ['messages.upsert', 'connection.update', 'qrcode.updated'],
          qrcode: true,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`Create failed with status ${createResponse.status}:`, errorText);
      
      // Handle specific error cases
      if (createResponse.status === 400 && errorText.includes('already exists')) {
        // Instance already exists, just return success
        return new Response(
          JSON.stringify({
            success: true,
            status: 'connecting',
            message: 'Instance already exists and is being initialized'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      throw new Error(`Failed to create instance: ${createResponse.status} - ${errorText}`);
    }

    const createData = await createResponse.json();
    console.log('Instance created successfully:', createData);

    // Update database with new instance data
    const updateData: any = {
      status: 'connecting',
      instance_id: createData.instance?.instanceId || null,
      instance_token: createData.hash || null,
      qr_code: createData.qrcode || null,
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instance.id);

    return new Response(
      JSON.stringify({
        success: true,
        status: 'connecting',
        qr_code: createData.qrcode || null,
        message: 'Instance recreated successfully, scan QR code to connect'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );


  } catch (error) {
    console.error('Error in whatsapp-reconnect:', error);
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