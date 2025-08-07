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
    const { action, test_phone } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') ?? '');
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's barbershop
    const { data: profile } = await supabase
      .from('profiles')
      .select('barbershop_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.barbershop_id) {
      return new Response(JSON.stringify({ error: 'Barbearia não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;

    if (action === 'simulate_incoming') {
      // Simulate an incoming message by calling our own webhook
      const testPayload = {
        event: 'messages.upsert',
        instance: `test_instance_${profile.barbershop_id}`,
        data: {
          key: {
            remoteJid: test_phone || '5511999999999@s.whatsapp.net',
            fromMe: false,
            id: `test_message_${Date.now()}`
          },
          message: {
            conversation: '🧪 Mensagem de teste do sistema - recebimento funcionando!'
          },
          messageType: 'conversation',
          messageTimestamp: Math.floor(Date.now() / 1000),
          pushName: 'Teste Sistema'
        }
      };

      console.log('Simulando mensagem recebida:', testPayload);

      // Call our webhook directly
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      const webhookResult = await webhookResponse.text();
      
      return new Response(JSON.stringify({
        success: webhookResponse.ok,
        message: 'Teste de mensagem recebida enviado',
        webhook_status: webhookResponse.status,
        webhook_response: webhookResult,
        test_payload: testPayload
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'test_webhook_connectivity') {
      // Test webhook connectivity
      const testPayload = {
        event: 'test.connectivity',
        instance: 'test_instance',
        data: {
          message: 'Teste de conectividade webhook',
          timestamp: new Date().toISOString()
        }
      };

      console.log('Testando conectividade do webhook');

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      const responseTime = Date.now();
      
      return new Response(JSON.stringify({
        success: webhookResponse.ok,
        message: 'Teste de conectividade realizado',
        webhook_status: webhookResponse.status,
        response_time: responseTime,
        webhook_reachable: webhookResponse.ok
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'check_recent_messages') {
      // Check for recent messages in the database
      const { data: recentMessages } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
        .order('created_at', { ascending: false });

      return new Response(JSON.stringify({
        success: true,
        message: 'Mensagens recentes verificadas',
        recent_messages: recentMessages || [],
        count: recentMessages?.length || 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Ação não reconhecida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Message test error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});