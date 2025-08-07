import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { barbershopId } = await req.json();

    if (!barbershopId) {
      throw new Error('barbershopId is required');
    }

    console.log(`Starting WhatsApp instance reset for barbershop: ${barbershopId}`);

    // 1. Get current instance data
    const { data: currentInstance, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch current instance: ${fetchError.message}`);
    }

    // 2. Delete from Evolution API if exists
    if (currentInstance?.evolution_instance_name) {
      try {
        const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
        const globalApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

        console.log(`Deleting instance from Evolution API: ${currentInstance.evolution_instance_name}`);

        const deleteResponse = await fetch(
          `${evolutionUrl}/instance/delete/${currentInstance.evolution_instance_name}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'apikey': globalApiKey,
            },
          }
        );

        if (!deleteResponse.ok) {
          console.log(`Failed to delete from Evolution API: ${deleteResponse.status}`);
        } else {
          console.log('Successfully deleted instance from Evolution API');
        }
      } catch (error) {
        console.log(`Error deleting from Evolution API: ${error.message}`);
      }
    }

    // 3. Reset database record
    const { error: resetError } = await supabase
      .from('whatsapp_instances')
      .update({
        status: 'disconnected',
        qr_code: null,
        phone_number: null,
        instance_id: null,
        instance_token: null,
        evolution_instance_name: null,
        webhook_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('barbershop_id', barbershopId);

    if (resetError) {
      throw new Error(`Failed to reset instance: ${resetError.message}`);
    }

    // 4. Create new instance via evolution-instance-manager
    try {
      console.log('Creating new WhatsApp instance...');
      const { data: newInstanceData, error: createError } = await supabase.functions.invoke(
        'evolution-instance-manager',
        {
          body: { 
            barbershopId,
            action: 'create'
          }
        }
      );

      if (createError) {
        console.error('Error creating new instance:', createError);
        // Continue with reset even if instance creation fails
        console.log('Continuing with database cleanup despite instance creation failure');
      } else {
        console.log('New instance created successfully:', newInstanceData);
      }
    } catch (instanceError) {
      console.error('Exception creating new instance:', instanceError);
      // Continue with reset - the database cleanup is more important
      console.log('Continuing with database cleanup despite instance creation exception');
    }

    // 5. Clean up old messages and conversations
    await supabase
      .from('whatsapp_messages')
      .delete()
      .eq('barbershop_id', barbershopId);

    await supabase
      .from('whatsapp_conversations')
      .delete()
      .eq('barbershop_id', barbershopId);

    console.log('WhatsApp instance reset completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp instance reset successfully',
        databaseReset: true,
        messagesCleared: true,
        conversationsCleared: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in whatsapp-reset-instance:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});