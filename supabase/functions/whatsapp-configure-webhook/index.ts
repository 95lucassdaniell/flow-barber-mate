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

    console.log(`Configuring webhook for instance: ${instance.evolution_instance_name}`);

    // Configure webhook with correct events
    const webhookResponse = await fetch(
      `${evolutionUrl}/webhook/set/${instance.evolution_instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${globalApiKey}`,
        },
        body: JSON.stringify({
          url: instance.webhook_url,
          enabled: true,
          events: [
            'MESSAGES_UPSERT',
            'CONNECTION_UPDATE', 
            'QRCODE_UPDATED',
            'SEND_MESSAGE'
          ]
        }),
      }
    );

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`Webhook configuration failed: ${webhookResponse.status} - ${errorText}`);
      throw new Error(`Failed to configure webhook: ${errorText}`);
    }

    const webhookData = await webhookResponse.json();
    console.log('Webhook configured successfully:', webhookData);

    // Update instance with webhook configuration timestamp
    await supabase
      .from('whatsapp_instances')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook configured successfully',
        webhook_url: instance.webhook_url,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED', 'SEND_MESSAGE']
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error configuring webhook:', error);
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