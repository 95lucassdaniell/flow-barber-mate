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

    console.log(`Configuring webhook for barbershop: ${barbershopId}`);

    // Get current instance
    const { data: instance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch instance: ${fetchError.message}`);
    }

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const globalApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    if (!instance.evolution_instance_name) {
      throw new Error('No Evolution instance name found');
    }

    const webhookUrl = 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook';
    
    console.log(`Configuring webhook: ${webhookUrl} for instance: ${instance.evolution_instance_name}`);

    // Configure webhook in Evolution API
    const webhookResponse = await fetch(
      `${evolutionUrl}/webhook/set/${instance.evolution_instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': globalApiKey,
        },
        body: JSON.stringify({
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: false,
          events: [
            'messages.upsert',
            'connection.update',
            'qrcode.updated'
          ]
        }),
      }
    );

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook configuration failed:', errorText);
      throw new Error(`Failed to configure webhook: ${webhookResponse.status} - ${errorText}`);
    }

    const webhookData = await webhookResponse.json();
    console.log('Webhook configured successfully:', webhookData);

    // Update instance with webhook URL
    await supabase
      .from('whatsapp_instances')
      .update({
        webhook_url: webhookUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook configured successfully',
        webhook_url: webhookUrl,
        instance_name: instance.evolution_instance_name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in whatsapp-configure-webhook:', error);
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