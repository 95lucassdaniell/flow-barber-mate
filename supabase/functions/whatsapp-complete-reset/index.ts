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

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Configuração da Evolution API não encontrada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Iniciando reset completo para barbearia: ${profile.barbershop_id}`);

    const steps = [];
    const errors = [];

    // Get current instance
    const { data: currentInstance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', profile.barbershop_id)
      .single();

    // Step 1: Delete existing instance from Evolution API
    if (currentInstance?.evolution_instance_name) {
      try {
        const deleteResponse = await fetch(`${evolutionApiUrl}/instance/delete/${currentInstance.evolution_instance_name}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${evolutionApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (deleteResponse.ok) {
          steps.push('Instância existente removida da Evolution API');
        } else {
          errors.push(`Falha ao remover instância: ${deleteResponse.status}`);
        }
      } catch (error) {
        errors.push(`Erro ao deletar instância: ${error.message}`);
      }
    }

    // Step 2: Clean database records
    try {
      // Delete messages
      await supabase
        .from('whatsapp_messages')
        .delete()
        .eq('barbershop_id', profile.barbershop_id);

      // Delete conversations
      await supabase
        .from('whatsapp_conversations')
        .delete()
        .eq('barbershop_id', profile.barbershop_id);

      steps.push('Mensagens e conversas antigas removidas');
    } catch (error) {
      errors.push(`Erro ao limpar banco: ${error.message}`);
    }

    // Step 3: Generate new instance name
    const { data: barbershop } = await supabase
      .from('barbershops')
      .select('slug, name')
      .eq('id', profile.barbershop_id)
      .single();

    const timestamp = Date.now();
    const instanceName = `barber_${barbershop?.slug?.replace(/[^a-zA-Z0-9]/g, '') || 'barbershop'}_${timestamp}`;

    // Step 4: Create new instance in Evolution API
    try {
      const createResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${evolutionApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: instanceName,
          token: evolutionApiKey,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      });

      if (createResponse.ok) {
        const createData = await createResponse.json();
        steps.push(`Nova instância criada: ${instanceName}`);
        
        // Step 5: Configure webhook
        const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
        
        const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${evolutionApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: webhookUrl,
            enabled: true,
            events: [
              'APPLICATION_STARTUP',
              'QRCODE_UPDATED',
              'CONNECTION_UPDATE',
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'SEND_MESSAGE'
            ]
          })
        });

        if (webhookResponse.ok) {
          steps.push('Webhook configurado com todos os eventos');
        } else {
          errors.push(`Falha ao configurar webhook: ${webhookResponse.status}`);
        }

        // Step 6: Update database
        if (currentInstance) {
          await supabase
            .from('whatsapp_instances')
            .update({
              evolution_instance_name: instanceName,
              instance_id: createData.instance?.instanceId || null,
              instance_token: createData.hash || null,
              status: 'awaiting_qr_scan',
              phone_number: null,
              qr_code: null,
              webhook_url: webhookUrl,
              last_connected_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentInstance.id);
        } else {
          await supabase
            .from('whatsapp_instances')
            .insert({
              barbershop_id: profile.barbershop_id,
              evolution_instance_name: instanceName,
              instance_id: createData.instance?.instanceId || null,
              instance_token: createData.hash || null,
              api_type: 'evolution',
              status: 'awaiting_qr_scan',
              webhook_url: webhookUrl,
              business_name: barbershop?.name || 'Barbearia'
            });
        }

        steps.push('Registro atualizado no banco de dados');

        // Step 7: Generate QR Code
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for instance to be ready

        const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${evolutionApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        let qrCode = null;
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          qrCode = qrData.base64 || qrData.qrcode || null;
          
          if (qrCode) {
            // Update QR code in database
            await supabase
              .from('whatsapp_instances')
              .update({ qr_code: qrCode })
              .eq('barbershop_id', profile.barbershop_id);
            
            steps.push('QR Code gerado com sucesso');
          }
        }

        return new Response(JSON.stringify({
          success: true,
          instance_name: instanceName,
          steps_completed: steps,
          errors: errors,
          qr_code: qrCode,
          next_steps: [
            'Escaneie o QR Code com o WhatsApp',
            'Aguarde a confirmação da conexão',
            'Teste o recebimento de mensagens'
          ]
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } else {
        const errorData = await createResponse.text();
        errors.push(`Falha ao criar instância: ${createResponse.status} - ${errorData}`);
      }
    } catch (error) {
      errors.push(`Erro ao criar instância: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: false,
      steps_completed: steps,
      errors: errors
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Complete reset error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});