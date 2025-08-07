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

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Configuração da Evolution API não encontrada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Forçando nova conexão para: ${instance.evolution_instance_name}`);

    const steps = [];
    let qrCode = null;

    try {
      // Step 1: Logout to disconnect any existing session
      console.log('1. Desconectando sessão existente...');
      const logoutResponse = await fetch(`${evolutionApiUrl}/instance/logout/${instance.evolution_instance_name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${evolutionApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (logoutResponse.ok) {
        steps.push('Sessão anterior desconectada com sucesso');
      } else {
        steps.push('Aviso: Não foi possível desconectar sessão anterior (pode não ter existido)');
      }

      // Step 2: Wait a moment for logout to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Generate new QR Code
      console.log('2. Gerando novo QR Code...');
      const connectResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instance.evolution_instance_name}`, {
        headers: {
          'Authorization': `Bearer ${evolutionApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (connectResponse.ok) {
        const connectData = await connectResponse.json();
        qrCode = connectData.base64 || connectData.qrcode;
        steps.push('Novo QR Code gerado com sucesso');
        console.log('QR Code gerado:', qrCode ? 'Sim' : 'Não');
      } else {
        const errorText = await connectResponse.text();
        steps.push(`Erro ao gerar QR Code: ${connectResponse.status} - ${errorText}`);
        console.error('Erro na geração do QR Code:', errorText);
      }

      // Step 4: Update database
      console.log('3. Atualizando banco de dados...');
      const updateData: any = {
        status: 'awaiting_qr_scan',
        phone_number: null,
        qr_code: qrCode,
        updated_at: new Date().toISOString()
      };

      await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', instance.id);

      steps.push('Banco de dados atualizado');

      // Step 5: Configure webhook to ensure events are properly received
      console.log('4. Configurando webhook...');
      const webhookUrl = 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook';
      
      const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instance.evolution_instance_name}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${evolutionApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: webhookUrl,
          events: [
            'QRCODE_UPDATED',
            'CONNECTION_UPDATE', 
            'MESSAGES_UPSERT',
            'SEND_MESSAGE'
          ],
          webhook_by_events: false
        })
      });

      if (webhookResponse.ok) {
        steps.push('Webhook configurado com eventos corretos');
      } else {
        const webhookError = await webhookResponse.text();
        steps.push(`Aviso: Webhook pode não ter sido configurado corretamente: ${webhookError}`);
      }

    } catch (error) {
      console.error('Erro durante força de conexão:', error);
      steps.push(`Erro: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      instanceName: instance.evolution_instance_name,
      qrCode: qrCode,
      steps: steps,
      nextSteps: [
        '1. Escaneie o QR Code com seu WhatsApp',
        '2. Aguarde a confirmação de conexão',
        '3. Teste enviando uma mensagem para o número da instância',
        '4. Verifique se as mensagens chegam no sistema'
      ]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Force connection error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});