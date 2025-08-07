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

    console.log(`Iniciando correção de conexão fantasma para: ${instance.evolution_instance_name}`);

    const fixes = [];
    let finalStatus = instance.status;
    let phoneNumber = instance.phone_number;
    let qrCode = instance.qr_code;

    // Step 1: Check real connection status
    try {
      console.log('1. Verificando status real na Evolution API...');
      const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance.evolution_instance_name}`, {
        headers: {
          'Authorization': `Bearer ${evolutionApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('Status real:', statusData);
        
        // Check if it's a ghost connection (connected but no phone)
        if (statusData.instance?.state === 'open' && !instance.phone_number) {
          fixes.push('⚠️ Conexão fantasma detectada: instância conectada mas sem dispositivo');
          
          // Force disconnect to clean state
          console.log('2. Forçando desconexão da sessão fantasma...');
          const logoutResponse = await fetch(`${evolutionApiUrl}/instance/logout/${instance.evolution_instance_name}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${evolutionApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (logoutResponse.ok) {
            fixes.push('✅ Sessão fantasma desconectada com sucesso');
          } else {
            fixes.push('⚠️ Falha ao desconectar sessão fantasma');
          }
          
          // Wait for logout to process
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Get phone number if connected with real device
        if (statusData.instance?.state === 'open') {
          try {
            const instanceResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
              headers: {
                'Authorization': `Bearer ${evolutionApiKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (instanceResponse.ok) {
              const instancesData = await instanceResponse.json();
              const currentInstance = instancesData.find((inst: any) => inst.name === instance.evolution_instance_name);
              
              if (currentInstance?.instance?.wuid) {
                phoneNumber = currentInstance.instance.wuid.split('@')[0];
                fixes.push('✅ Número do telefone recuperado');
              }
            }
          } catch (error) {
            console.error('Erro ao buscar instâncias:', error);
          }
        }
        
      } else {
        fixes.push('❌ Erro ao verificar status na Evolution API');
        console.error('Erro no status:', statusResponse.status, await statusResponse.text());
      }
    } catch (error) {
      console.error('Erro na verificação de status:', error);
      fixes.push('❌ Falha na comunicação com Evolution API');
    }

    // Step 2: Generate new QR code if needed
    if (!phoneNumber) {
      try {
        console.log('3. Gerando novo QR Code...');
        const connectResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instance.evolution_instance_name}`, {
          headers: {
            'Authorization': `Bearer ${evolutionApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (connectResponse.ok) {
          const connectData = await connectResponse.json();
          qrCode = connectData.base64 || connectData.qrcode;
          finalStatus = 'awaiting_qr_scan';
          fixes.push('✅ Novo QR Code gerado');
          console.log('QR Code gerado com sucesso');
        } else {
          const errorText = await connectResponse.text();
          fixes.push(`❌ Erro ao gerar QR Code: ${connectResponse.status}`);
          console.error('Erro na geração do QR Code:', errorText);
        }
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        fixes.push('❌ Falha ao gerar novo QR Code');
      }
    } else {
      finalStatus = 'connected';
      fixes.push('✅ Dispositivo já conectado');
    }

    // Step 3: Configure webhook properly
    try {
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
        fixes.push('✅ Webhook configurado corretamente');
      } else {
        const webhookError = await webhookResponse.text();
        fixes.push(`⚠️ Webhook pode não ter sido configurado: ${webhookError}`);
      }
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      fixes.push('❌ Falha ao configurar webhook');
    }

    // Step 4: Update database with corrected status
    console.log('5. Atualizando banco de dados...');
    const updateData: any = {
      status: finalStatus,
      phone_number: phoneNumber,
      qr_code: qrCode,
      updated_at: new Date().toISOString()
    };

    if (phoneNumber) {
      updateData.last_connected_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instance.id);

    if (updateError) {
      console.error('Erro ao atualizar banco:', updateError);
      fixes.push('❌ Falha ao atualizar banco de dados');
    } else {
      fixes.push('✅ Banco de dados atualizado');
    }

    // Generate recommendations based on the current state
    const recommendations = [];
    
    if (!phoneNumber) {
      recommendations.push('📱 Escaneie o QR Code com seu WhatsApp para conectar um dispositivo real');
      recommendations.push('⏱️ O QR Code expira em alguns minutos, gere um novo se necessário');
    } else {
      recommendations.push('✅ Dispositivo conectado! Teste enviando uma mensagem');
      recommendations.push('🔍 Verifique se as mensagens chegam no sistema');
    }

    recommendations.push('🔄 Use o Monitor de Conexão regularmente para detectar problemas');
    recommendations.push('📊 Monitore os logs do webhook para debugging');

    return new Response(JSON.stringify({
      success: true,
      instanceName: instance.evolution_instance_name,
      originalStatus: instance.status,
      finalStatus: finalStatus,
      phoneNumber: phoneNumber,
      qrCode: qrCode,
      fixes: fixes,
      recommendations: recommendations,
      ghostConnectionFixed: !instance.phone_number && phoneNumber ? true : false
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Ghost connection fix error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});