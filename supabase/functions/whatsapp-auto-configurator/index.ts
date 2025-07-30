import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
    console.log("=== WHATSAPP AUTO CONFIGURATOR STARTED ===");
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar instâncias que precisam ser configuradas
    const { data: pendingInstances, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select(`
        *,
        barbershops (
          id,
          name,
          slug
        )
      `)
      .eq('status', 'pending_configuration')
      .eq('auto_created', true);

    if (fetchError) {
      console.error('Error fetching pending instances:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingInstances?.length || 0} pending instances to configure`);

    let configuredCount = 0;
    
    if (pendingInstances && pendingInstances.length > 0) {
      for (const instance of pendingInstances) {
        try {
          console.log(`Configuring instance: ${instance.evolution_instance_name} for barbershop: ${instance.barbershops?.name}`);
          
          // Chamar a função evolution-instance-manager para configurar a instância
          const { data: managerResult, error: managerError } = await supabase.functions.invoke(
            'evolution-instance-manager',
            {
              body: {
                action: 'create',
                barbershopId: instance.barbershop_id
              }
            }
          );

          if (managerError) {
            console.error(`Error configuring instance ${instance.evolution_instance_name}:`, managerError);
            
            // Atualizar status para erro
            await supabase
              .from('whatsapp_instances')
              .update({ 
                status: 'configuration_error',
                updated_at: new Date().toISOString()
              })
              .eq('id', instance.id);
              
            continue;
          }

          console.log(`Successfully configured instance ${instance.evolution_instance_name}`);
          configuredCount++;
          
          // Atualizar status para disconnected (pronto para conexão)
          await supabase
            .from('whatsapp_instances')
            .update({ 
              status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('id', instance.id);

        } catch (error) {
          console.error(`Error processing instance ${instance.evolution_instance_name}:`, error);
          
          // Atualizar status para erro
          await supabase
            .from('whatsapp_instances')
            .update({ 
              status: 'configuration_error',
              updated_at: new Date().toISOString()
            })
            .eq('id', instance.id);
        }
      }
    }

    console.log(`Auto-configurator completed. Configured ${configuredCount} instances.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        configured: configuredCount,
        total_pending: pendingInstances?.length || 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Auto-configurator error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});