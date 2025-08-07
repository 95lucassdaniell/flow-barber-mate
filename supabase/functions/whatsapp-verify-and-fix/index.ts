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

    console.log(`Verificando e corrigindo instância: ${instance.evolution_instance_name}`);

    let appliedFixes = [];
    let realStatus = 'disconnected';
    let phoneNumber = null;
    let qrCode = null;

    // 1. Check real status from Evolution API
    try {
      const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance.evolution_instance_name}`, {
        headers: {
          'Authorization': `Bearer ${evolutionApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        realStatus = statusData.instance?.state || 'close';
        
        // Get phone number if connected
        if (realStatus === 'open') {
          const infoResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances?instanceName=${instance.evolution_instance_name}`, {
            headers: {
              'Authorization': `Bearer ${evolutionApiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (infoResponse.ok) {
            const infoData = await infoResponse.json();
            if (infoData.length > 0) {
              phoneNumber = infoData[0].instance?.wuid || null;
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }

    // 2. Check webhook configuration
    let webhookConfigured = false;
    try {
      const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/find/${instance.evolution_instance_name}`, {
        headers: {
          'Authorization': `Bearer ${evolutionApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        webhookConfigured = webhookData.webhook?.url === instance.webhook_url;
      }
    } catch (error) {
      console.error('Erro ao verificar webhook:', error);
    }

    // 3. Apply fixes
    
    // Fix 1: Update database status to match reality
    const actualStatus = phoneNumber ? 'connected' : (realStatus === 'close' ? 'disconnected' : 'awaiting_qr_scan');
    const isGhostConnection = instance.status === 'connected' && !phoneNumber;
    
    if (instance.status !== actualStatus || instance.phone_number !== phoneNumber) {
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          status: actualStatus,
          phone_number: phoneNumber,
          last_connected_at: phoneNumber ? new Date().toISOString() : null
        })
        .eq('id', instance.id);

      if (!updateError) {
        appliedFixes.push(`Status atualizado: ${instance.status} → ${actualStatus}`);
        if (phoneNumber !== instance.phone_number) {
          appliedFixes.push(`Telefone atualizado: ${instance.phone_number || 'null'} → ${phoneNumber || 'null'}`);
        }
        if (isGhostConnection) {
          appliedFixes.push('Conexão fantasma corrigida');
        }
      }
    }

    // Fix 2: Configure webhook if not configured
    if (!webhookConfigured) {
      try {
        const webhookConfig = {
          url: instance.webhook_url,
          events: [
            'QRCODE_UPDATED',
            'CONNECTION_UPDATE', 
            'MESSAGES_UPSERT',
            'SEND_MESSAGE'
          ],
          webhook_by_events: false
        };

        const webhookSetResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instance.evolution_instance_name}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${evolutionApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookConfig)
        });

        if (webhookSetResponse.ok) {
          appliedFixes.push('Webhook configurado corretamente');
        }
      } catch (error) {
        console.error('Erro ao configurar webhook:', error);
      }
    }

    // Fix 3: Generate new QR Code if disconnected or no phone
    if (!phoneNumber) {
      try {
        const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instance.evolution_instance_name}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${evolutionApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          qrCode = qrData.base64 || qrData.qrcode?.base64;
          
          if (qrCode) {
            const { error: updateQrError } = await supabase
              .from('whatsapp_instances')
              .update({
                qr_code: qrCode,
                status: 'awaiting_qr_scan'
              })
              .eq('id', instance.id);

            if (!updateQrError) {
              appliedFixes.push('Novo QR Code gerado');
            }
          }
        }
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      }
    }

    // 4. Final status and recommendations
    let recommendations = [];
    
    if (isGhostConnection) {
      recommendations.push('⚠️ Conexão fantasma corrigida - status do banco atualizado');
    }
    
    if (!phoneNumber && qrCode) {
      recommendations.push('📱 Escaneie o novo QR Code com seu WhatsApp para conectar um dispositivo real');
      recommendations.push('🔄 Após escanear, mensagens serão recebidas automaticamente');
    } else if (phoneNumber) {
      recommendations.push('✅ WhatsApp conectado e funcionando - mensagens podem ser recebidas');
    } else {
      recommendations.push('🔄 Tente forçar uma nova conexão se problemas persistirem');
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        database_status: instance.status,
        real_status: actualStatus,
        phone_connected: !!phoneNumber,
        webhook_configured: webhookConfigured,
        ghost_connection_detected: isGhostConnection
      },
      applied_fixes: appliedFixes,
      final_status: actualStatus,
      qr_code: qrCode ? `data:image/png;base64,${qrCode}` : null,
      recommendations
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verify and fix error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});