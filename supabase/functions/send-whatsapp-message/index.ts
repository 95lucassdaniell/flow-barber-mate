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
    const { 
      phone, 
      message, 
      messageType = 'text', 
      barbershop_id,
      conversation_id: conversationId,
      ai_handled: aiHandled,
      human_agent_id: humanAgentId 
    } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for internal calls
    );

    let targetBarbershopId = barbershop_id;

    // If no barbershop_id provided, try to get it from authenticated user
    if (!targetBarbershopId) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No authorization or barbershop_id provided' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );

      const { data: { user } } = await userSupabase.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get user's barbershop
      const { data: profile } = await userSupabase
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

      targetBarbershopId = profile.barbershop_id;
    }

    // Get instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', targetBarbershopId)
      .single();

    if (!instance || instance.status !== 'connected') {
      return new Response(JSON.stringify({ error: 'WhatsApp not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    // Format phone number for Brazil (add 55 if not present)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }
    let sendData;

    // Check API type and send accordingly
    if (instance.api_type === 'evolution') {
      if (!evolutionApiUrl || !evolutionApiKey) {
        return new Response(JSON.stringify({ error: 'EvolutionAPI not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Send message via Evolution API
      try {
        const sendResponse = await fetch(`${evolutionApiUrl}/message/sendText/${instance.evolution_instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey
          },
          body: JSON.stringify({
            number: `${formattedPhone}@s.whatsapp.net`,
            text: message
          })
        });

        sendData = await sendResponse.json();

        if (!sendResponse.ok) {
          console.error('Evolution API Send Error:', sendData);
          return new Response(JSON.stringify({ 
            error: 'Failed to send message via EvolutionAPI',
            details: sendData 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('Evolution API Send Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to send message via EvolutionAPI' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Legacy Z-API support
      const zapiToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
      if (!zapiToken) {
        return new Response(JSON.stringify({ error: 'Z-API token not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const sendResponse = await fetch(`https://api.z-api.io/instances/${instance.instance_id}/token/${instance.instance_token}/send-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': zapiToken
          },
          body: JSON.stringify({
            phone: formattedPhone,
            message: message
          })
        });

        sendData = await sendResponse.json();

        if (!sendData.value) {
          console.error('Z-API Send response:', sendData);
          return new Response(JSON.stringify({ error: 'Failed to send message via Z-API' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('Z-API Send Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to send message via Z-API' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Create or get conversation if not provided
    let finalConversationId = conversationId;
    
    if (!finalConversationId) {
      console.log('Creating/finding conversation for phone:', formattedPhone);
      
      const { data: conversation, error: convError } = await supabase
        .from('whatsapp_conversations')
        .upsert({
          barbershop_id: targetBarbershopId,
          client_phone: formattedPhone,
          last_message_at: new Date().toISOString()
        }, {
          onConflict: 'barbershop_id,client_phone'
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
      } else {
        finalConversationId = conversation?.id;
        console.log('Conversation created/found:', finalConversationId);
      }
    }

    // Save message to database with conversation support
    const { error: dbError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: finalConversationId,
        barbershop_id: targetBarbershopId,
        instance_id: instance.id,
        message_id: sendData.key?.id || sendData.value || null,
        phone_number: formattedPhone,
        message_type: messageType,
        content: { conversation: message },
        direction: 'outgoing',
        status: 'sent',
        ai_handled: !!aiHandled,
        human_agent_id: humanAgentId
      });

    if (dbError) {
      console.error('Error saving message:', dbError);
    }

    // Update conversation timestamp if we have a conversation
    if (finalConversationId) {
      await supabase
        .from('whatsapp_conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          human_agent_id: humanAgentId 
        })
        .eq('id', finalConversationId);
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: sendData.key?.id || sendData.value,
      phone: formattedPhone,
      api_type: instance.api_type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-whatsapp-message:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});