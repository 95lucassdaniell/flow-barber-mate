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
    const { appointment_id, trigger_type } = body;

    if (!appointment_id || !trigger_type) {
      return new Response(
        JSON.stringify({ error: 'appointment_id and trigger_type are required' }),
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

    // Get active automations for this trigger type and barbershop
    const { data: automations, error: automationsError } = await supabase
      .from('whatsapp_automations')
      .select(`
        id,
        barbershop_id,
        name,
        description,
        trigger_type,
        template_id,
        delay_minutes,
        is_active,
        created_at,
        updated_at
      `)
      .eq('barbershop_id', appointment.barbershop_id)
      .eq('trigger_type', trigger_type)
      .eq('is_active', true);

    console.log('Automations query result:', automations, automationsError);

    if (automationsError) {
      console.error('Error fetching automations:', automationsError);
      return new Response(
        JSON.stringify({ error: 'Error fetching automations' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results = [];

    for (const automation of automations || []) {
      try {
        console.log('Processing automation:', automation.id, 'for trigger:', trigger_type);
        
        // Get the template for this automation
        const { data: template, error: templateError } = await supabase
          .from('whatsapp_templates')
          .select('*')
          .eq('id', automation.template_id)
          .eq('is_active', true)
          .single();

        if (templateError || !template) {
          console.error('Error fetching template:', templateError);
          results.push({
            automation_id: automation.id,
            template_name: 'Template not found',
            phone: appointment.client?.phone || 'Unknown',
            status: 'failed',
            error: 'Template not found or inactive'
          });
          continue;
        }

        console.log('Found template:', template.name, 'Content:', template.content);

        // Replace template variables
        const processedMessage = await supabase.rpc('replace_template_variables', {
          template_content: template.content,
          appointment_id: appointment_id
        });

        if (processedMessage.error) {
          console.error('Error processing template:', processedMessage.error);
          continue;
        }

        const finalMessage = processedMessage.data;
        const clientPhone = appointment.client?.phone;

        if (!clientPhone) {
          console.error('No phone number for client');
          results.push({
            automation_id: automation.id,
            template_name: template.name,
            phone: 'No phone',
            status: 'failed',
            error: 'Client has no phone number'
          });
          continue;
        }

        console.log('Sending WhatsApp message to:', clientPhone, 'Message:', finalMessage);

        // Send WhatsApp message
        const { data: messageResult, error: messageError } = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            phone: clientPhone,
            message: finalMessage,
            messageType: 'text'
          }
        });

        console.log('WhatsApp send result:', messageResult, 'Error:', messageError);

        // Log the automation execution
        const logData = {
          barbershop_id: appointment.barbershop_id,
          appointment_id: appointment_id,
          automation_id: automation.id,
          phone: clientPhone,
          message_content: finalMessage,
          status: messageError ? 'failed' : 'sent',
          error_message: messageError?.message || null
        };

        await supabase
          .from('whatsapp_automation_logs')
          .insert([logData]);

        results.push({
          automation_id: automation.id,
          template_name: template.name,
          phone: clientPhone,
          status: messageError ? 'failed' : 'sent',
          error: messageError?.message || null
        });

      } catch (error) {
        console.error('Error processing automation:', error);
        results.push({
          automation_id: automation.id,
          template_name: 'Unknown',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed_automations: results.length,
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in whatsapp-automations function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});