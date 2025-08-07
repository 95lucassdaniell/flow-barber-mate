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
      return new Response(JSON.stringify({ 
        error: 'Instância WhatsApp não encontrada',
        needsCreation: true
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

    console.log(`Verificando status real da instância: ${instance.evolution_instance_name}`);

    // Check real status on Evolution API
    const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${instance.evolution_instance_name}`, {
      headers: {
        'Authorization': `Bearer ${evolutionApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    let realStatus = 'disconnected';
    let realPhoneNumber = null;
    let qrCode = null;
    let needsConnection = false;

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('Status real da Evolution API:', statusData);
      
      realStatus = statusData.instance?.state || 'disconnected';
      
      // Get instance info for phone number
      const infoResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances?instanceName=${instance.evolution_instance_name}`, {
        headers: {
          'Authorization': `Bearer ${evolutionApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        console.log('Info da instância:', infoData);
        
        if (infoData.length > 0) {
          realPhoneNumber = infoData[0].instance?.wuid || null;
        }
      }

      // If connected but no phone number, something is wrong
      if (realStatus === 'open' && !realPhoneNumber) {
        console.log('Instância conectada mas sem número de telefone - forçando reconexão');
        needsConnection = true;
        realStatus = 'disconnected';
      }

      // If not connected, get QR Code
      if (realStatus !== 'open') {
        try {
          const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instance.evolution_instance_name}`, {
            headers: {
              'Authorization': `Bearer ${evolutionApiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            qrCode = qrData.base64 || qrData.qrcode;
            console.log('QR Code gerado para conexão');
          }
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
        }
      }
    } else {
      console.error(`Evolution API retornou ${statusResponse.status}: ${statusResponse.statusText}`);
    }

    // Update database with real status
    const updateData: any = {
      status: realStatus === 'open' ? 'connected' : 'disconnected',
      updated_at: new Date().toISOString()
    };

    if (realPhoneNumber) {
      updateData.phone_number = realPhoneNumber;
      updateData.last_connected_at = new Date().toISOString();
    }

    if (qrCode) {
      updateData.qr_code = qrCode;
    }

    await supabase
      .from('whatsapp_instances')
      .update(updateData)
      .eq('id', instance.id);

    const result = {
      instanceName: instance.evolution_instance_name,
      databaseStatus: instance.status,
      realStatus: realStatus,
      databasePhone: instance.phone_number,
      realPhone: realPhoneNumber,
      statusMismatch: instance.status !== (realStatus === 'open' ? 'connected' : 'disconnected'),
      phoneMismatch: instance.phone_number !== realPhoneNumber,
      needsConnection: needsConnection || realStatus !== 'open',
      qrCode: qrCode,
      recommendations: []
    };

    // Add recommendations
    if (result.statusMismatch) {
      result.recommendations.push('Status no banco difere do status real');
    }
    
    if (result.phoneMismatch) {
      result.recommendations.push('Número de telefone no banco difere do real');
    }
    
    if (result.needsConnection) {
      result.recommendations.push('Instância precisa ser conectada a um dispositivo WhatsApp real');
    }
    
    if (!realPhoneNumber && realStatus === 'open') {
      result.recommendations.push('Instância conectada mas sem número de telefone - reconexão necessária');
    }

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Real status check error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});