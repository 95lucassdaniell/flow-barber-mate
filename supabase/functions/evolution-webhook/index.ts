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

    const webhookData = await req.json();
    console.log('Evolution Webhook received:', JSON.stringify(webhookData, null, 2));

    const { instance, event, data } = webhookData;

    if (!instance) {
      console.log('No instance provided in webhook');
      return new Response('OK', { status: 200 });
    }

    // Get the WhatsApp instance from database
    const { data: whatsappInstance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('evolution_instance_name', instance)
      .single();

    if (!whatsappInstance) {
      console.log(`WhatsApp instance not found: ${instance}`);
      return new Response('OK', { status: 200 });
    }

    // Handle different webhook events
    switch (event) {
      case 'qrcode.updated':
        if (data?.qrcode) {
          await supabase
            .from('whatsapp_instances')
            .update({
              qr_code: data.qrcode,
              status: 'connecting'
            })
            .eq('id', whatsappInstance.id);
          
          console.log(`QR Code updated for instance: ${instance}`);
        }
        break;

      case 'connection.update':
        let newStatus = 'disconnected';
        let phoneNumber = null;

        if (data?.state === 'open') {
          newStatus = 'connected';
          phoneNumber = data?.user?.id?.split('@')[0] || null;
        } else if (data?.state === 'connecting') {
          newStatus = 'connecting';
        } else if (data?.state === 'close') {
          newStatus = 'disconnected';
        }

        await supabase
          .from('whatsapp_instances')
          .update({
            status: newStatus,
            phone_number: phoneNumber,
            last_connected_at: newStatus === 'connected' ? new Date().toISOString() : whatsappInstance.last_connected_at,
            qr_code: newStatus === 'connected' ? null : whatsappInstance.qr_code
          })
          .eq('id', whatsappInstance.id);

        console.log(`Connection updated for instance ${instance}: ${newStatus}`);
        break;

      case 'messages.upsert':
        // Handle incoming messages
        if (data?.messages) {
          for (const message of data.messages) {
            if (message.key?.fromMe === false) {
              // This is an incoming message
              const phoneNumber = message.key?.remoteJid?.split('@')[0];
              const messageContent = message.message?.conversation || 
                                  message.message?.extendedTextMessage?.text || 
                                  'Media message';

              // Save incoming message to database
              await supabase
                .from('whatsapp_messages')
                .insert({
                  instance_id: whatsappInstance.id,
                  phone_number: phoneNumber,
                  message: messageContent,
                  type: 'received',
                  status: 'delivered',
                  external_id: message.key?.id,
                  barbershop_id: whatsappInstance.barbershop_id
                });

              console.log(`Incoming message saved from ${phoneNumber}: ${messageContent}`);
            }
          }
        }
        break;

      case 'send.message':
        // Handle message sending status updates
        if (data?.key?.id) {
          await supabase
            .from('whatsapp_messages')
            .update({
              status: 'sent',
              external_id: data.key.id
            })
            .eq('external_id', data.key.id);

          console.log(`Message status updated: ${data.key.id}`);
        }
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error processing Evolution webhook:', error);
    return new Response('Error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});