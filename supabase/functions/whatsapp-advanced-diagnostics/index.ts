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
      return new Response(JSON.stringify({ 
        error: 'Instância WhatsApp não encontrada',
        create_needed: true
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Configuração da Evolution API não encontrada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Verificando status da instância: ${instance.evolution_instance_name}`);

    const diagnostics = {
      database_status: instance.status,
      database_phone: instance.phone_number,
      evolution_status: null,
      evolution_phone: null,
      webhook_configured: false,
      webhook_events: [],
      message_count_24h: 0,
      last_message_time: null,
      connection_issues: [],
      recommendations: []
    };

    // Check Evolution API status
    try {
      const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance.evolution_instance_name}`, {
        headers: {
          'Authorization': `Bearer ${evolutionApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        diagnostics.evolution_status = statusData.instance?.state || 'unknown';
        
        // Get instance info
        const infoResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances?instanceName=${instance.evolution_instance_name}`, {
          headers: {
            'Authorization': `Bearer ${evolutionApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (infoResponse.ok) {
          const infoData = await infoResponse.json();
          if (infoData.length > 0) {
            diagnostics.evolution_phone = infoData[0].instance?.wuid || null;
          }
        }
      } else {
        diagnostics.connection_issues.push(`Evolution API retornou ${statusResponse.status}: ${statusResponse.statusText}`);
      }
    } catch (error) {
      diagnostics.connection_issues.push(`Erro ao conectar Evolution API: ${error.message}`);
    }

    // Check webhook configuration
    try {
      const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instance.evolution_instance_name}`, {
        headers: {
          'Authorization': `Bearer ${evolutionApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        diagnostics.webhook_configured = webhookData.webhook?.url === instance.webhook_url;
        diagnostics.webhook_events = webhookData.webhook?.events || [];
      }
    } catch (error) {
      diagnostics.connection_issues.push(`Erro ao verificar webhook: ${error.message}`);
    }

    // Count recent messages
    const { count: messageCount } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('barbershop_id', profile.barbershop_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    diagnostics.message_count_24h = messageCount || 0;

    // Get last message time
    const { data: lastMessage } = await supabase
      .from('whatsapp_messages')
      .select('created_at')
      .eq('barbershop_id', profile.barbershop_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    diagnostics.last_message_time = lastMessage?.created_at || null;

    // Generate recommendations
    if (diagnostics.database_status !== diagnostics.evolution_status) {
      diagnostics.recommendations.push('Status no banco difere do status real na Evolution API');
    }

    if (diagnostics.database_phone !== diagnostics.evolution_phone) {
      diagnostics.recommendations.push('Número de telefone no banco difere do Evolution API');
    }

    if (!diagnostics.webhook_configured) {
      diagnostics.recommendations.push('Webhook não está configurado corretamente');
    }

    if (diagnostics.message_count_24h === 0) {
      diagnostics.recommendations.push('Nenhuma mensagem recebida nas últimas 24 horas');
    }

    const requiredEvents = ['messages.upsert', 'connection.update', 'qrcode.updated'];
    const missingEvents = requiredEvents.filter(event => !diagnostics.webhook_events.includes(event));
    if (missingEvents.length > 0) {
      diagnostics.recommendations.push(`Eventos webhook ausentes: ${missingEvents.join(', ')}`);
    }

    // Health score calculation
    let healthScore = 100;
    if (diagnostics.database_status !== 'connected') healthScore -= 30;
    if (diagnostics.evolution_status !== 'open') healthScore -= 30;
    if (!diagnostics.webhook_configured) healthScore -= 20;
    if (diagnostics.message_count_24h === 0) healthScore -= 10;
    if (missingEvents.length > 0) healthScore -= 10;

    return new Response(JSON.stringify({
      success: true,
      diagnostics,
      health_score: Math.max(0, healthScore),
      health_status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Advanced diagnostics error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});