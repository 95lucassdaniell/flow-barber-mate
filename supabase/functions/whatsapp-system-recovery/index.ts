import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, barbershopId } = await req.json()
    console.log(`🔧 Sistema Recovery WhatsApp - Ação: ${action}`)

    if (action === 'full_diagnosis') {
      return await performFullDiagnosis(supabase, barbershopId)
    } else if (action === 'recover_system') {
      return await recoverWhatsAppSystem(supabase, barbershopId)
    } else if (action === 'test_webhook') {
      return await testWebhook(supabase, barbershopId)
    }

    return new Response(
      JSON.stringify({ error: 'Ação não reconhecida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro no sistema recovery:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function performFullDiagnosis(supabase: any, barbershopId: string) {
  console.log(`🔍 Iniciando diagnóstico completo para barbershop: ${barbershopId}`)
  
  const diagnosis = {
    instanceStatus: null,
    webhookStatus: null,
    lastMessages: null,
    evolutionApiStatus: null,
    recommendations: []
  }

  try {
    // 1. Verificar instância no Supabase
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single()

    diagnosis.instanceStatus = {
      exists: !!instance,
      status: instance?.status,
      instanceName: instance?.evolution_instance_name,
      lastUpdate: instance?.updated_at,
      hasQrCode: !!instance?.qr_code
    }

    // 2. Verificar últimas mensagens
    const { data: recentMessages, count: messageCount } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .eq('barbershop_id', barbershopId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    const incomingCount = recentMessages?.filter(msg => msg.direction === 'incoming').length || 0
    const outgoingCount = recentMessages?.filter(msg => msg.direction === 'outgoing').length || 0

    diagnosis.lastMessages = {
      total24h: messageCount || 0,
      incoming24h: incomingCount,
      outgoing24h: outgoingCount,
      lastIncoming: recentMessages?.find(msg => msg.direction === 'incoming')?.created_at,
      lastOutgoing: recentMessages?.find(msg => msg.direction === 'outgoing')?.created_at
    }

    // 3. Verificar status na Evolution API
    if (instance?.evolution_instance_name) {
      try {
        const evolutionResponse = await fetch(
          `${Deno.env.get('EVOLUTION_API_URL')}/instance/connectionState/${instance.evolution_instance_name}`,
          {
            headers: {
              'apikey': Deno.env.get('EVOLUTION_GLOBAL_API_KEY') || '',
              'Content-Type': 'application/json'
            }
          }
        )

        if (evolutionResponse.ok) {
          const evolutionData = await evolutionResponse.json()
          diagnosis.evolutionApiStatus = {
            connected: evolutionResponse.ok,
            state: evolutionData.state,
            instance: evolutionData.instance
          }
        } else {
          diagnosis.evolutionApiStatus = {
            connected: false,
            error: `HTTP ${evolutionResponse.status}`
          }
        }
      } catch (error) {
        diagnosis.evolutionApiStatus = {
          connected: false,
          error: error.message
        }
      }
    }

    // 4. Verificar webhook
    diagnosis.webhookStatus = {
      configured: !!instance?.webhook_url,
      url: instance?.webhook_url
    }

    // 5. Gerar recomendações
    if (!diagnosis.lastMessages.incoming24h && diagnosis.lastMessages.outgoing24h > 0) {
      diagnosis.recommendations.push({
        type: 'critical',
        message: 'Sistema não está recebendo mensagens, apenas enviando'
      })
    }

    if (diagnosis.instanceStatus.hasQrCode) {
      diagnosis.recommendations.push({
        type: 'warning',
        message: 'Instância desconectada - necessário escanear QR code'
      })
    }

    if (!diagnosis.evolutionApiStatus?.connected) {
      diagnosis.recommendations.push({
        type: 'critical',
        message: 'Falha na comunicação com Evolution API'
      })
    }

    if (diagnosis.evolutionApiStatus?.state !== 'open') {
      diagnosis.recommendations.push({
        type: 'warning',
        message: `Estado da conexão WhatsApp: ${diagnosis.evolutionApiStatus?.state}`
      })
    }

    console.log('✅ Diagnóstico completo finalizado')
    return new Response(
      JSON.stringify({ success: true, diagnosis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error)
    return new Response(
      JSON.stringify({ error: 'Falha no diagnóstico', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function recoverWhatsAppSystem(supabase: any, barbershopId: string) {
  console.log(`🔄 Iniciando recovery do sistema WhatsApp para barbershop: ${barbershopId}`)
  
  const recoverySteps = []

  try {
    // 1. Buscar instância atual
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single()

    if (!instance) {
      recoverySteps.push({ step: 'instance_check', status: 'failed', message: 'Instância não encontrada' })
      return new Response(
        JSON.stringify({ success: false, steps: recoverySteps }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    recoverySteps.push({ step: 'instance_check', status: 'success', message: 'Instância encontrada' })

    // 2. Reconfigurar webhook na Evolution API
    if (instance.evolution_instance_name) {
      try {
        const webhookUrl = 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook'
        
        const webhookResponse = await fetch(
          `${Deno.env.get('EVOLUTION_API_URL')}/webhook/set/${instance.evolution_instance_name}`,
          {
            method: 'POST',
            headers: {
              'apikey': Deno.env.get('EVOLUTION_GLOBAL_API_KEY') || '',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: webhookUrl,
              webhook_by_events: false,
              webhook_base64: false,
              events: [
                'QRCODE_UPDATED',
                'CONNECTION_UPDATE',
                'MESSAGES_UPSERT',
                'SEND_MESSAGE'
              ]
            })
          }
        )

        if (webhookResponse.ok) {
          recoverySteps.push({ step: 'webhook_config', status: 'success', message: 'Webhook reconfigurado' })
          
          // Atualizar webhook URL no Supabase
          await supabase
            .from('whatsapp_instances')
            .update({ 
              webhook_url: webhookUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', instance.id)
            
        } else {
          recoverySteps.push({ step: 'webhook_config', status: 'failed', message: 'Falha ao configurar webhook' })
        }
      } catch (error) {
        recoverySteps.push({ step: 'webhook_config', status: 'failed', message: error.message })
      }

      // 3. Verificar e reconectar instância se necessário
      try {
        const statusResponse = await fetch(
          `${Deno.env.get('EVOLUTION_API_URL')}/instance/connectionState/${instance.evolution_instance_name}`,
          {
            headers: {
              'apikey': Deno.env.get('EVOLUTION_GLOBAL_API_KEY') || '',
              'Content-Type': 'application/json'
            }
          }
        )

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          
          if (statusData.state !== 'open') {
            // Tentar reconectar
            const connectResponse = await fetch(
              `${Deno.env.get('EVOLUTION_API_URL')}/instance/connect/${instance.evolution_instance_name}`,
              {
                method: 'GET',
                headers: {
                  'apikey': Deno.env.get('EVOLUTION_GLOBAL_API_KEY') || '',
                  'Content-Type': 'application/json'
                }
              }
            )

            if (connectResponse.ok) {
              recoverySteps.push({ step: 'reconnection', status: 'success', message: 'Reconexão iniciada' })
            } else {
              recoverySteps.push({ step: 'reconnection', status: 'failed', message: 'Falha na reconexão' })
            }
          } else {
            recoverySteps.push({ step: 'connection_check', status: 'success', message: 'Instância já conectada' })
          }
        }
      } catch (error) {
        recoverySteps.push({ step: 'connection_check', status: 'failed', message: error.message })
      }

      // 4. Atualizar status no Supabase
      await supabase
        .from('whatsapp_instances')
        .update({
          status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('id', instance.id)

      recoverySteps.push({ step: 'database_update', status: 'success', message: 'Status atualizado no banco' })
    }

    console.log('✅ Recovery finalizado')
    return new Response(
      JSON.stringify({ success: true, steps: recoverySteps }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro no recovery:', error)
    recoverySteps.push({ step: 'recovery', status: 'failed', message: error.message })
    
    return new Response(
      JSON.stringify({ success: false, steps: recoverySteps }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function testWebhook(supabase: any, barbershopId: string) {
  console.log(`🧪 Testando webhook para barbershop: ${barbershopId}`)

  try {
    // Simular recebimento de mensagem via webhook
    const testPayload = {
      event: 'messages.upsert',
      instance: 'test_webhook',
      data: {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
          id: 'test_' + Date.now()
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'Teste Webhook',
        message: {
          conversation: 'Mensagem de teste do sistema de recovery'
        }
      }
    }

    // Chamar nosso próprio webhook
    const webhookResponse = await fetch(
      'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/evolution-webhook',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify(testPayload)
      }
    )

    if (webhookResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook funcionando corretamente',
          status: webhookResponse.status 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Webhook com problemas',
          status: webhookResponse.status 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('❌ Erro no teste de webhook:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}