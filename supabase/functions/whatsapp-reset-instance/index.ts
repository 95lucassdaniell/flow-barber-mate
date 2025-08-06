import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== WHATSAPP RESET INSTANCE STARTED ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { barbershopId } = await req.json();
    console.log('Resetting WhatsApp instance for barbershop:', barbershopId);

    // Get current instance data
    const { data: currentInstance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single();

    if (!currentInstance) {
      return new Response(JSON.stringify({ error: 'WhatsApp instance not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Current instance found:', currentInstance);

    // Step 1: Delete existing instance from Evolution API if it exists
    if (currentInstance.evolution_instance_name) {
      console.log('Deleting existing Evolution API instance...');
      
      const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
      const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

      if (evolutionApiUrl && evolutionApiKey) {
        try {
          const deleteResponse = await fetch(`${evolutionApiUrl}/instance/delete/${currentInstance.evolution_instance_name}`, {
            method: 'DELETE',
            headers: {
              'apikey': evolutionApiKey,
            },
          });
          
          console.log('Delete response status:', deleteResponse.status);
          if (deleteResponse.ok) {
            console.log('Existing instance deleted successfully');
          } else {
            console.log('Failed to delete existing instance, continuing anyway...');
          }
        } catch (error) {
          console.error('Error deleting existing instance:', error);
          console.log('Continuing with reset anyway...');
        }
      }
    }

    // Step 2: Reset database instance data
    console.log('Resetting database instance data...');
    const resetData = {
      status: 'disconnected',
      phone_number: null,
      qr_code: null,
      last_connected_at: null,
      instance_id: null,
      instance_token: null,
      evolution_instance_name: null,
      updated_at: new Date().toISOString()
    };

    const { error: resetError } = await supabase
      .from('whatsapp_instances')
      .update(resetData)
      .eq('barbershop_id', barbershopId);

    if (resetError) {
      console.error('Error resetting database:', resetError);
      return new Response(JSON.stringify({ 
        error: 'Failed to reset database instance',
        details: resetError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Database instance reset successfully');

    // Step 3: Create new instance using the evolution-instance-manager
    console.log('Creating new Evolution API instance...');
    
    const { data: createResult, error: createError } = await supabase.functions.invoke('evolution-instance-manager', {
      body: {
        action: 'create',
        barbershopId: barbershopId
      }
    });

    if (createError) {
      console.error('Error creating new instance:', createError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create new instance',
        details: createError 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('New instance created successfully:', createResult);

    // Step 4: Clear any existing conversations and messages for a fresh start (optional)
    console.log('Clearing existing conversations and messages...');
    
    await supabase
      .from('whatsapp_messages')
      .delete()
      .eq('barbershop_id', barbershopId);

    await supabase
      .from('whatsapp_conversations')
      .delete()
      .eq('barbershop_id', barbershopId);

    console.log('WhatsApp reset completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'WhatsApp instance reset successfully',
      instanceCreated: createResult?.success || false,
      nextStep: 'Please reconnect via QR Code'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in whatsapp-reset-instance:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});