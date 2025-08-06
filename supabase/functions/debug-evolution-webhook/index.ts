import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log all request details for debugging
    const requestInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      origin: req.headers.get('origin'),
      userAgent: req.headers.get('user-agent'),
      contentType: req.headers.get('content-type')
    };

    console.log('=== DEBUG WEBHOOK REQUEST ===');
    console.log('Request Info:', JSON.stringify(requestInfo, null, 2));

    let body = null;
    try {
      const rawBody = await req.text();
      console.log('Raw body:', rawBody);
      
      if (rawBody) {
        body = JSON.parse(rawBody);
        console.log('Parsed body:', JSON.stringify(body, null, 2));
      }
    } catch (bodyError) {
      console.log('Body parsing error:', bodyError.message);
    }

    // Extract instance information
    const instanceName = body?.instance || 'unknown';
    const event = body?.data?.event || body?.event || 'unknown';
    
    console.log(`Processing event: ${event} for instance: ${instanceName}`);

    // Log the webhook call to database for debugging
    try {
      const { error: logError } = await supabase
        .from('whatsapp_webhook_logs')
        .insert({
          instance_name: instanceName,
          event_type: event,
          request_headers: requestInfo.headers,
          request_body: body,
          received_at: new Date().toISOString()
        });

      if (logError) {
        console.log('Failed to log webhook call:', logError);
      } else {
        console.log('Webhook call logged successfully');
      }
    } catch (logError) {
      console.log('Error logging webhook:', logError);
    }

    // Find the WhatsApp instance in database
    let whatsappInstance = null;
    try {
      const { data: instance, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('evolution_instance_name', instanceName)
        .single();

      if (instanceError) {
        console.log('Instance lookup error:', instanceError);
      } else {
        whatsappInstance = instance;
        console.log('Found WhatsApp instance:', instance.id);
      }
    } catch (instanceError) {
      console.log('Instance lookup failed:', instanceError);
    }

    // Process different event types
    let response = { success: true, message: 'Event processed' };

    switch (event) {
      case 'qrcode.updated':
        console.log('Processing QR code update...');
        if (whatsappInstance && body?.data?.qrcode) {
          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update({
              qr_code: body.data.qrcode,
              status: 'waiting_scan',
              updated_at: new Date().toISOString()
            })
            .eq('id', whatsappInstance.id);

          if (updateError) {
            console.log('QR code update error:', updateError);
            response = { success: false, error: updateError.message };
          } else {
            console.log('QR code updated successfully');
          }
        }
        break;

      case 'connection.update':
        console.log('Processing connection update...');
        if (whatsappInstance && body?.data) {
          const connectionData = body.data;
          const updateData: any = {
            status: connectionData.state === 'open' ? 'connected' : 'disconnected',
            updated_at: new Date().toISOString()
          };

          if (connectionData.state === 'open' && connectionData.instance?.wuid) {
            updateData.phone_number = connectionData.instance.wuid.replace('@s.whatsapp.net', '');
          }

          const { error: updateError } = await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('id', whatsappInstance.id);

          if (updateError) {
            console.log('Connection update error:', updateError);
            response = { success: false, error: updateError.message };
          } else {
            console.log('Connection status updated successfully');
          }
        }
        break;

      case 'messages.upsert':
        console.log('Processing message upsert...');
        if (whatsappInstance && body?.data?.messages && Array.isArray(body.data.messages)) {
          for (const message of body.data.messages) {
            if (message.key && message.key.fromMe === false) {
              // This is an incoming message
              const phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
              const messageContent = message.message?.conversation || 
                                   message.message?.extendedTextMessage?.text || 
                                   'Mensagem não suportada';

              console.log(`Incoming message from ${phoneNumber}: ${messageContent}`);

              // Save message to database
              const { error: messageError } = await supabase
                .from('whatsapp_messages')
                .insert({
                  barbershop_id: whatsappInstance.barbershop_id,
                  phone_number: phoneNumber,
                  content: messageContent,
                  direction: 'incoming',
                  status: 'received',
                  whatsapp_message_id: message.key.id
                });

              if (messageError) {
                console.log('Message save error:', messageError);
              } else {
                console.log('Message saved successfully');
              }

              // Update or create conversation
              const { error: conversationError } = await supabase
                .from('whatsapp_conversations')
                .upsert({
                  barbershop_id: whatsappInstance.barbershop_id,
                  phone_number: phoneNumber,
                  last_message_at: new Date().toISOString(),
                  last_message: messageContent
                }, {
                  onConflict: 'barbershop_id,phone_number'
                });

              if (conversationError) {
                console.log('Conversation update error:', conversationError);
              } else {
                console.log('Conversation updated successfully');
              }
            }
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
        response = { success: true, message: `Event ${event} logged but not processed` };
    }

    console.log('=== END DEBUG WEBHOOK ===');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Debug webhook error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});