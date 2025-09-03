import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatabaseAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  client_id: string;
  barber_id: string;
  barbershop_id: string;
  service_id?: string;
  client?: {
    name: string;
    phone: string;
  };
  barber?: {
    full_name: string;
  };
  service?: {
    name: string;
  };
  barbershop?: {
    name: string;
    address: string;
  };
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
    );

    const body = await req.json();
    const { appointment_id, trigger_type, automation_id, scheduled_job_id } = body;

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: 'appointment_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get appointment details with related data
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(*),
        barber:profiles!appointments_barber_id_fkey(*),
        service:services(*),
        barbershop:barbershops(*)
      `)
      .eq('id', appointment_id)
      .single();

    if (appointmentError || !appointment) {
      console.error('Error fetching appointment:', appointmentError);
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let automations = [];
    
    if (automation_id) {
      // Process specific automation (from scheduler)
      const { data: specificAutomation, error: automationError } = await supabase
        .from('whatsapp_automations')
        .select(`
          *,
          whatsapp_templates (*)
        `)
        .eq('id', automation_id)
        .eq('is_active', true)
        .single();

      if (automationError || !specificAutomation) {
        console.error('Error fetching specific automation:', automationError);
        return new Response(
          JSON.stringify({ error: 'Automation not found or inactive' }), 
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      automations = [specificAutomation];
    } else if (trigger_type) {
      // Process all automations for trigger type (immediate triggers)
      const { data: triggerAutomations, error: automationsError } = await supabase
        .from('whatsapp_automations')
        .select(`
          *,
          whatsapp_templates (*)
        `)
        .eq('barbershop_id', appointment.barbershop_id)
        .eq('event_type', getEventTypeFromTrigger(trigger_type))
        .eq('timing_type', 'immediate')
        .eq('is_active', true);

      if (automationsError) {
        console.error('Error fetching automations:', automationsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch automations' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      automations = triggerAutomations || [];
    }

    if (!automations || automations.length === 0) {
      console.log('No active automations found');
      return new Response(
        JSON.stringify({ message: 'No active automations found', processed: 0 }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const automation of automations || []) {
      try {
        console.log('Processing automation:', automation.id, 'Name:', automation.name);
        
        if (!automation.whatsapp_templates) {
          console.error(`No template found for automation ${automation.id}`);
          results.push({
            automation_id: automation.id,
            status: 'error',
            error: 'Template not found'
          });
          continue;
        }

        // Get the template content using the existing RPC function
        const { data: processedContent, error: rpcError } = await supabase
          .rpc('replace_template_variables', {
            template_content: automation.whatsapp_templates.content,
            appointment_id: appointment_id
          });

        if (rpcError) {
          console.error('Error processing template variables:', rpcError);
          results.push({
            automation_id: automation.id,
            status: 'error',
            error: 'Failed to process template variables'
          });
          continue;
        }

        const messageContent = processedContent || automation.whatsapp_templates.content;
        const clientPhone = appointment.client?.phone;

        if (!clientPhone) {
          console.error('Client phone not found');
          results.push({
            automation_id: automation.id,
            status: 'error',
            error: 'Client phone not found'
          });
          continue;
        }

        console.log(`Sending message to ${clientPhone}: ${messageContent.substring(0, 50)}...`);

        // Send WhatsApp message via send-whatsapp-message function
        const { data: messageResult, error: messageError } = await supabase.functions
          .invoke('send-whatsapp-message', {
            body: {
              phone: clientPhone,
              message: messageContent,
              barbershop_id: appointment.barbershop_id
            }
          });

        if (messageError) {
          console.error('Error sending WhatsApp message:', messageError);
          
          // Log the failed automation
          await supabase
            .from('whatsapp_automation_logs')
            .insert([{
              barbershop_id: appointment.barbershop_id,
              automation_id: automation.id,
              appointment_id: appointment_id,
              phone: clientPhone,
              message_content: messageContent,
              status: 'failed',
              error_message: messageError.message || 'Unknown error'
            }]);

          results.push({
            automation_id: automation.id,
            status: 'failed',
            error: messageError.message
          });
        } else {
          console.log(`Message sent successfully for automation ${automation.id}`);
          
          // Log the successful automation
          await supabase
            .from('whatsapp_automation_logs')
            .insert([{
              barbershop_id: appointment.barbershop_id,
              automation_id: automation.id,
              appointment_id: appointment_id,
              phone: clientPhone,
              message_content: messageContent,
              status: 'sent',
              sent_at: new Date().toISOString()
            }]);

          results.push({
            automation_id: automation.id,
            status: 'sent',
            phone: clientPhone
          });
        }

      } catch (error) {
        console.error(`Error processing automation ${automation.id}:`, error);
        results.push({
          automation_id: automation.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: results.filter(r => r.status === 'sent').length,
        total: automations.length,
        results: results
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in whatsapp-automations function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to map trigger types to event types
function getEventTypeFromTrigger(trigger_type: string): string {
  switch (trigger_type) {
    case 'appointment_created':
      return 'scheduled';
    case 'appointment_cancelled':
      return 'cancelled';
    case 'appointment_completed':
      return 'completed';
    case 'appointment_no_show':
      return 'no_show';
    default:
      return 'scheduled';
  }
}