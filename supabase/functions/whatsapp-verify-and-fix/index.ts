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
        error: 'WhatsApp instance not found',
        action_needed: 'create_instance'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey || !instance.evolution_instance_name) {
      return new Response(JSON.stringify({ 
        error: 'Evolution API configuration missing',
        action_needed: 'configure_api'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Verifying WhatsApp instance: ${instance.evolution_instance_name}`);

    // Step 1: Check real status from Evolution API
    let realStatus = null;
    let phoneNumber = null;
    let needsQrCode = false;
    let isReallyConnected = false;

    try {
      const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance.evolution_instance_name}`, {
        method: 'GET',
        headers: { 'apikey': evolutionApiKey }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Evolution API real status:', JSON.stringify(statusData, null, 2));
        
        realStatus = statusData.instance?.state || 'disconnected';
        phoneNumber = statusData.instance?.user?.id?.split('@')[0] || null;
        isReallyConnected = realStatus === 'open' && phoneNumber !== null;
        needsQrCode = realStatus === 'close' || realStatus === 'connecting' || !phoneNumber;

        console.log(`Real status: ${realStatus}, Phone: ${phoneNumber}, Connected: ${isReallyConnected}`);
      } else {
        console.log('Instance not found in Evolution API, needs creation');
        needsQrCode = true;
      }
    } catch (error) {
      console.error('Error checking Evolution API status:', error);
      needsQrCode = true;
    }

    // Step 2: Verify webhook configuration
    let webhookConfigured = false;
    try {
      const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instance.evolution_instance_name}`, {
        method: 'GET',
        headers: { 'apikey': evolutionApiKey }
      });

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        console.log('Webhook status:', JSON.stringify(webhookData, null, 2));
        
        const expectedWebhookUrl = 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook';
        webhookConfigured = webhookData.webhook?.url === expectedWebhookUrl;
      }
    } catch (error) {
      console.error('Error checking webhook:', error);
    }

    // Step 3: Apply fixes based on analysis
    const fixes = [];
    let finalStatus = instance.status;
    let newQrCode = null;

    // Fix 1: Update database status to match reality
    if (realStatus && (instance.status !== realStatus || instance.phone_number !== phoneNumber)) {
      await supabase
        .from('whatsapp_instances')
        .update({
          status: isReallyConnected ? 'connected' : 'disconnected',
          phone_number: phoneNumber,
          last_connected_at: isReallyConnected ? new Date().toISOString() : instance.last_connected_at
        })
        .eq('id', instance.id);
      
      finalStatus = isReallyConnected ? 'connected' : 'disconnected';
      fixes.push(`Updated database status from ${instance.status} to ${finalStatus}`);
    }

    // Fix 2: Configure webhook if missing
    if (!webhookConfigured) {
      try {
        const webhookUrl = 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook';
        const webhookConfig = await fetch(`${evolutionApiUrl}/webhook/set/${instance.evolution_instance_name}`, {
          method: 'POST',
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: webhookUrl,
            events: [
              'MESSAGES_UPSERT',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED'
            ]
          })
        });

        if (webhookConfig.ok) {
          fixes.push('Configured webhook successfully');
          
          await supabase
            .from('whatsapp_instances')
            .update({ webhook_url: webhookUrl })
            .eq('id', instance.id);
        } else {
          fixes.push('Failed to configure webhook');
        }
      } catch (error) {
        console.error('Error configuring webhook:', error);
        fixes.push('Error configuring webhook');
      }
    }

    // Fix 3: Generate new QR code if needed
    if (needsQrCode && !isReallyConnected) {
      try {
        console.log('Generating new QR code for connection');
        
        // First try to restart the instance
        try {
          const restartResponse = await fetch(`${evolutionApiUrl}/instance/restart/${instance.evolution_instance_name}`, {
            method: 'PUT',
            headers: { 'apikey': evolutionApiKey }
          });
          
          if (restartResponse.ok) {
            fixes.push('Restarted instance successfully');
          }
        } catch (restartError) {
          console.log('Restart failed, will try to get QR code directly');
        }

        // Get QR code
        const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instance.evolution_instance_name}`, {
          method: 'GET',
          headers: { 'apikey': evolutionApiKey }
        });

        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          if (qrData.base64) {
            newQrCode = qrData.base64;
            
            await supabase
              .from('whatsapp_instances')
              .update({
                qr_code: newQrCode,
                status: 'awaiting_qr_scan'
              })
              .eq('id', instance.id);
            
            fixes.push('Generated new QR code for connection');
            finalStatus = 'awaiting_qr_scan';
          }
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        fixes.push('Failed to generate QR code');
      }
    }

    const result = {
      success: true,
      analysis: {
        database_status: instance.status,
        real_status: realStatus,
        phone_number: phoneNumber,
        is_really_connected: isReallyConnected,
        webhook_configured: webhookConfigured,
        needs_qr_code: needsQrCode
      },
      fixes_applied: fixes,
      final_status: finalStatus,
      qr_code: newQrCode,
      recommendations: []
    };

    // Add recommendations
    if (!isReallyConnected && !needsQrCode) {
      result.recommendations.push('Instance shows as connected but no phone number. May need manual reconnection.');
    }
    
    if (isReallyConnected && webhookConfigured) {
      result.recommendations.push('Everything looks good! Instance is connected and webhook is configured.');
    }
    
    if (!isReallyConnected && newQrCode) {
      result.recommendations.push('Scan the QR code with WhatsApp to complete the connection.');
    }

    console.log('Verification complete:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in whatsapp-verify-and-fix:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      fixes_applied: [],
      recommendations: ['Check logs for detailed error information']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});