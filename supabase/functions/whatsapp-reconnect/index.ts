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

    console.log(`Starting WhatsApp reconnection for barbershop: ${barbershopId}`);

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

    // Try to restart the instance first
    console.log(`Attempting to restart instance: ${instance.evolution_instance_name}`);
    
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

        // Check connection state after restart
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
          
          if (stateData.instance?.state === 'open') {
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
                message: 'Instance reconnected successfully'
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              }
            );
          }
        }
      }
    } catch (restartError) {
      console.log(`Restart failed: ${restartError.message}`);
    }

    // If restart failed, try to delete and recreate
    console.log('Restart failed, attempting to recreate instance');

    try {
      // Delete instance
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
    } catch (deleteError) {
      console.log(`Delete failed: ${deleteError.message}`);
    }

    // First check if instance already exists
    const checkResponse = await fetch(
      `${evolutionUrl}/instance/fetchInstances`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': globalApiKey,
        },
      }
    );

    let instanceExists = false;
    if (checkResponse.ok) {
      const existingInstances = await checkResponse.json();
      instanceExists = existingInstances.some((inst: any) => 
        inst.instance?.instanceName === instance.evolution_instance_name
      );
    }

    // Only create if it doesn't exist
    if (!instanceExists) {
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
        throw new Error(`Failed to create instance: ${createResponse.status} - ${errorText}`);
      }

      const createData = await createResponse.json();
      console.log('Instance created:', createData);

      // Update database
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
          status: createData.qrcode ? 'connecting' : 'connected',
          qr_code: createData.qrcode || null,
          message: 'Instance recreated successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      console.log('Instance already exists, checking state');
      
      // Instance exists, just check its state
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
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);

        return new Response(
          JSON.stringify({
            success: true,
            status,
            message: 'Instance state checked successfully'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        throw new Error(`Failed to check instance state: ${stateResponse.status}`);
      }
    }


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