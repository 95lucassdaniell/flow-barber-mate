import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Get WhatsApp instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', profile.barbershop_id)
      .single();

    if (!instance) {
      return new Response(JSON.stringify({ error: 'Instância WhatsApp não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!instance.phone_number) {
      return new Response(JSON.stringify({ 
        error: 'Instância não tem número conectado',
        needsConnection: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check recent messages
    const { data: recentMessages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('barbershop_id', profile.barbershop_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) {
      console.error('Erro ao buscar mensagens:', messagesError);
    }

    // Check webhook logs (if available)
    const webhookUrl = 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook';
    
    const testResults = {
      instanceName: instance.evolution_instance_name,
      phoneNumber: instance.phone_number,
      status: instance.status,
      lastConnectedAt: instance.last_connected_at,
      recentMessagesCount: recentMessages?.length || 0,
      recentMessages: recentMessages || [],
      webhookUrl: webhookUrl,
      recommendations: []
    };

    // Add recommendations based on findings
    if (testResults.recentMessagesCount === 0) {
      testResults.recommendations.push('Nenhuma mensagem recente encontrada - teste enviando uma mensagem WhatsApp');
    }
    
    if (instance.status !== 'connected') {
      testResults.recommendations.push('Instância não está conectada - reconecte primeiro');
    }
    
    if (!instance.last_connected_at) {
      testResults.recommendations.push('Sem registro de última conexão - verifique se já foi conectada');
    }

    // Instructions for testing
    testResults.recommendations.push('Para testar: envie uma mensagem WhatsApp para este número');
    testResults.recommendations.push('Aguarde alguns segundos e verifique se a mensagem aparece aqui');

    return new Response(JSON.stringify({
      success: true,
      data: testResults,
      instructions: [
        `Envie uma mensagem WhatsApp para: ${instance.phone_number}`,
        'Aguarde alguns segundos para o webhook processar',
        'Verifique se a mensagem aparece na lista de mensagens recentes',
        'Se não funcionar, verifique a configuração do webhook e conexão'
      ]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test message reception error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});