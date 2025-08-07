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

    // Get WhatsApp instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', profile.barbershop_id)
      .single();

    if (!instance) {
      throw new Error('WhatsApp instance not found');
    }

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const globalApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    if (!evolutionUrl || !globalApiKey) {
      throw new Error('Evolution API credentials not configured');
    }

    console.log(`Monitoring connection for instance: ${instance.evolution_instance_name}`);

    // Check instance connection state
    const connectionResponse = await fetch(
      `${evolutionUrl}/instance/connect/${instance.evolution_instance_name}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${globalApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let connectionState = 'disconnected';
    let phoneNumber = null;
    let qrCode = null;
    let needsNewConnection = false;

    if (connectionResponse.ok) {
      const connectionData = await connectionResponse.json();
      console.log('Connection state:', connectionData);
      
      connectionState = connectionData.instance?.state || 'disconnected';
      
      // Check if we have a real phone number connected
      if (connectionData.instance?.owner) {
        phoneNumber = connectionData.instance.owner;
      }
      
      // If state is "open" but no phone number, it's a ghost connection
      if (connectionState === 'open' && !phoneNumber) {
        console.log('Ghost connection detected - instance open but no phone number');
        connectionState = 'ghost_connection';
        needsNewConnection = true;
      }
    } else {
      console.log(`Connection check failed: ${connectionResponse.status}`);
      needsNewConnection = true;
    }

    // If we need a new connection, generate QR code
    if (needsNewConnection) {
      console.log('Generating new QR code for fresh connection');
      
      // First logout any existing session
      try {
        await fetch(`${evolutionUrl}/instance/logout/${instance.evolution_instance_name}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${globalApiKey}`,
          },
        });
      } catch (error) {
        console.log('Logout failed or instance not found:', error);
      }

      // Generate new QR code
      const qrResponse = await fetch(
        `${evolutionUrl}/instance/connect/${instance.evolution_instance_name}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${globalApiKey}`,
          },
        }
      );

      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        qrCode = qrData.base64 || qrData.qrcode?.base64;
        connectionState = 'awaiting_qr_scan';
        console.log('New QR code generated successfully');
      }
    }

    // Update database with real status
    const updateData: any = {
      status: connectionState,
      phone_number: phoneNumber,
      updated_at: new Date().toISOString()
    };

    if (qrCode) {
      updateData.qr_code = qrCode;
    }

    await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instance.id);

    return new Response(
      JSON.stringify({
        success: true,
        instance_name: instance.evolution_instance_name,
        connection_state: connectionState,
        phone_number: phoneNumber,
        has_qr_code: !!qrCode,
        needs_new_connection: needsNewConnection,
        monitoring_results: {
          database_status: instance.status,
          real_status: connectionState,
          database_phone: instance.phone_number,
          real_phone: phoneNumber,
          ghost_connection_detected: connectionState === 'ghost_connection'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error monitoring WhatsApp connection:', error);
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