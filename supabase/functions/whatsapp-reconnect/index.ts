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
      return new Response(JSON.stringify({ error: 'WhatsApp instance not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Evolution API not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Attempting to reconnect instance: ${instance.evolution_instance_name}`);

    try {
      // First, try to restart the instance
      const restartResponse = await fetch(`${evolutionApiUrl}/instance/restart/${instance.evolution_instance_name}`, {
        method: 'PUT',
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!restartResponse.ok) {
        console.log('Restart failed, trying to recreate instance...');
        
        // If restart fails, try to delete and recreate the instance
        try {
          await fetch(`${evolutionApiUrl}/instance/delete/${instance.evolution_instance_name}`, {
            method: 'DELETE',
            headers: {
              'apikey': evolutionApiKey
            }
          });
        } catch (deleteError) {
          console.log('Delete instance failed (this is expected if instance doesnt exist)');
        }

        // Wait a moment before recreating
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get barbershop details for webhook configuration
        const { data: barbershop } = await supabase
          .from('barbershops')
          .select('name, slug')
          .eq('id', profile.barbershop_id)
          .single();

        // Recreate the instance
        const createResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
          method: 'POST',
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instanceName: instance.evolution_instance_name,
            token: evolutionApiKey,
            qrcode: true,
            webhook: `https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook`,
            webhookByEvents: false,
            webhookBase64: false,
            chatwootAccountId: null,
            chatwootToken: null,
            chatwootUrl: null,
            chatwootSignMsg: false,
            chatwootReopenConversation: false,
            chatwootConversationPending: false
          })
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to recreate instance: ${createResponse.statusText}`);
        }

        const createData = await createResponse.json();
        console.log('Instance recreated successfully:', createData);
      }

      // Update instance status
      await supabase
        .from('whatsapp_instances')
        .update({
          status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);

      // Wait a moment and check status
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance.evolution_instance_name}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionApiKey
        }
      });

      let newStatus = 'connecting';
      let qrCode = null;

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        
        if (statusData.instance?.state === 'open') {
          newStatus = 'connected';
        } else if (statusData.instance?.state === 'close') {
          // Try to get QR code for reconnection
          try {
            const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instance.evolution_instance_name}`, {
              method: 'GET',
              headers: {
                'apikey': evolutionApiKey
              }
            });

            if (qrResponse.ok) {
              const qrData = await qrResponse.json();
              qrCode = qrData.base64 || qrData.code;
              newStatus = 'connecting';
            }
          } catch (qrError) {
            console.error('Failed to get QR code:', qrError);
          }
        }
      }

      // Update final status
      await supabase
        .from('whatsapp_instances')
        .update({
          status: newStatus,
          qr_code: qrCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);

      return new Response(JSON.stringify({
        success: true,
        status: newStatus,
        qr_code: qrCode,
        message: 'Reconnection process completed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (apiError) {
      console.error('Evolution API Error during reconnection:', apiError);
      
      await supabase
        .from('whatsapp_instances')
        .update({
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id);

      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to reconnect to Evolution API',
        details: apiError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in whatsapp-reconnect:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});