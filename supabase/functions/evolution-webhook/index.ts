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
    console.log('=== EVOLUTION WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('User-Agent:', req.headers.get('user-agent'));
    console.log('Content-Type:', req.headers.get('content-type'));
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    console.log('=== WEBHOOK DATA RECEIVED ===');
    console.log('Full webhook data:', JSON.stringify(webhookData, null, 2));
    console.log('Data size:', JSON.stringify(webhookData).length, 'bytes');

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

    // Handle different webhook events - using correct Evolution API event names
    switch (event) {
      case 'QRCODE_UPDATED':
      case 'qrcode.updated':
        console.log('=== QR CODE UPDATE EVENT ===');
        console.log('QR Code data:', JSON.stringify(data, null, 2));
        
        if (data?.qrcode) {
          await supabase
            .from('whatsapp_instances')
            .update({
              qr_code: data.qrcode,
              status: 'awaiting_qr_scan'
            })
            .eq('id', whatsappInstance.id);
          
          console.log(`QR Code updated for instance: ${instance}`);
        }
        break;

      case 'CONNECTION_UPDATE':
      case 'connection.update':
        console.log('=== CONNECTION UPDATE EVENT ===');
        console.log('Connection data:', JSON.stringify(data, null, 2));
        
        let newStatus = 'disconnected';
        let phoneNumber = null;

        if (data?.state === 'open') {
          newStatus = 'connected';
          phoneNumber = data?.user?.id?.split('@')[0] || null;
          console.log('WhatsApp connected successfully! Phone:', phoneNumber);
        } else if (data?.state === 'connecting') {
          newStatus = 'connecting';
          console.log('WhatsApp connecting...');
        } else if (data?.state === 'close') {
          newStatus = 'disconnected';
          console.log('WhatsApp disconnected');
        }

        const updateResult = await supabase
          .from('whatsapp_instances')
          .update({
            status: newStatus,
            phone_number: phoneNumber,
            last_connected_at: newStatus === 'connected' ? new Date().toISOString() : whatsappInstance.last_connected_at,
            qr_code: newStatus === 'connected' ? null : whatsappInstance.qr_code
          })
          .eq('id', whatsappInstance.id);

        if (updateResult.error) {
          console.error('Error updating connection status:', updateResult.error);
        } else {
          console.log(`Connection updated for instance ${instance}: ${newStatus} (Phone: ${phoneNumber})`);
        }
        break;

      case 'MESSAGES_UPSERT':
      case 'messages.upsert':
        console.log('=== MESSAGES UPSERT EVENT ===');
        console.log('Messages data:', JSON.stringify(data, null, 2));
        
        // Handle incoming messages
        if (data?.messages) {
          console.log(`Processing ${data.messages.length} messages`);
          
          for (const message of data.messages) {
            console.log('Processing message:', JSON.stringify(message, null, 2));
            
            if (message.key?.fromMe === false) {
              console.log('=== INCOMING MESSAGE DETECTED ===');
              
              // This is an incoming message
              const phoneNumber = message.key?.remoteJid?.split('@')[0];
              const messageContent = message.message?.conversation || 
                                  message.message?.extendedTextMessage?.text || 
                                  'Media message';
              
              console.log('Incoming message details:');
              console.log('- Phone:', phoneNumber);
              console.log('- Content:', messageContent);
              console.log('- Push name:', message.pushName);

              // Create or get conversation
              const { data: conversation, error: convError } = await supabase
                .from('whatsapp_conversations')
                .upsert({
                  barbershop_id: whatsappInstance.barbershop_id,
                  client_phone: phoneNumber,
                  client_name: message.pushName || null,
                  last_message_at: new Date().toISOString()
                }, {
                  onConflict: 'barbershop_id,client_phone'
                })
                .select()
                .single();

              if (convError) {
                console.error('Error creating/updating conversation:', convError);
              }

              // Save incoming message to database
              await supabase
                .from('whatsapp_messages')
                .insert({
                  conversation_id: conversation?.id,
                  instance_id: whatsappInstance.id,
                  phone_number: phoneNumber,
                  contact_name: message.pushName || null,
                  content: messageContent,
                  message_type: 'text',
                  direction: 'incoming',
                  status: 'received',
                  message_id: message.key?.id,
                  barbershop_id: whatsappInstance.barbershop_id
                });

              console.log(`Incoming message saved from ${phoneNumber}: ${messageContent}`);

              // Process with AI if conversation allows it
              if (conversation && 
                  !conversation.human_takeover && 
                  conversation.ai_enabled &&
                  messageContent !== 'Media message') {
                
                console.log('Processing message with AI...');
                
                try {
                  const aiResponse = await supabase.functions.invoke('whatsapp-ai-assistant', {
                    body: {
                      message: messageContent,
                      phone: phoneNumber,
                      barbershop_id: whatsappInstance.barbershop_id,
                      message_type: 'text'
                    }
                  });

                  if (aiResponse.error) {
                    console.error('AI processing error:', aiResponse.error);
                  } else {
                    console.log('AI processed successfully');
                    
                    // Send AI response if available
                    if (aiResponse.data?.ai_response && !aiResponse.data?.human_takeover) {
                      await supabase.functions.invoke('send-whatsapp-message', {
                        body: {
                          phone: phoneNumber,
                          message: aiResponse.data.ai_response,
                          barbershop_id: whatsappInstance.barbershop_id,
                          conversation_id: conversation.id,
                          ai_handled: true
                        }
                      });
                    }
                  }
                } catch (aiError) {
                  console.error('Error calling AI assistant:', aiError);
                }
              }
            }
          }
        }
        break;

      case 'SEND_MESSAGE':
      case 'send.message':
        console.log('=== SEND MESSAGE EVENT ===');
        console.log('Send message data:', JSON.stringify(data, null, 2));
        
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