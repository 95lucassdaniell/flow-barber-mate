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
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing WhatsApp reminders...');

    // Send 24h reminders for appointments tomorrow
    const { data: appointments24h, error: error24h } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        status,
        barbershop_id
      `)
      .eq('appointment_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .eq('status', 'scheduled');

    if (error24h) {
      console.error('Error fetching 24h appointments:', error24h);
    } else if (appointments24h) {
      console.log(`Found ${appointments24h.length} appointments for 24h reminders`);
      
      for (const appointment of appointments24h) {
        // Check if reminder already sent today
        const { data: existingLog } = await supabase
          .from('whatsapp_automation_logs')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('trigger_type', 'appointment_reminder_24h')
          .gte('sent_at', new Date().toISOString().split('T')[0])
          .single();

        if (!existingLog) {
          // Send 24h reminder
          const { error: reminderError } = await supabase.functions.invoke('whatsapp-automations', {
            body: {
              appointment_id: appointment.id,
              trigger_type: 'appointment_reminder_24h'
            }
          });

          if (reminderError) {
            console.error(`Error sending 24h reminder for appointment ${appointment.id}:`, reminderError);
          } else {
            console.log(`24h reminder sent for appointment ${appointment.id}`);
          }
        }
      }
    }

    // Send 1h reminders for appointments in the next hour
    const currentTime = new Date();
    const oneHourLater = new Date(currentTime.getTime() + 60 * 60 * 1000);
    const oneHourThirtyLater = new Date(currentTime.getTime() + 90 * 60 * 1000);

    const { data: appointments1h, error: error1h } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        status,
        barbershop_id
      `)
      .eq('appointment_date', currentTime.toISOString().split('T')[0])
      .eq('status', 'scheduled')
      .gte('start_time', oneHourLater.toTimeString().split(' ')[0])
      .lt('start_time', oneHourThirtyLater.toTimeString().split(' ')[0]);

    if (error1h) {
      console.error('Error fetching 1h appointments:', error1h);
    } else if (appointments1h) {
      console.log(`Found ${appointments1h.length} appointments for 1h reminders`);
      
      for (const appointment of appointments1h) {
        // Check if reminder already sent today
        const { data: existingLog } = await supabase
          .from('whatsapp_automation_logs')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('trigger_type', 'appointment_reminder_1h')
          .gte('sent_at', new Date().toISOString().split('T')[0])
          .single();

        if (!existingLog) {
          // Send 1h reminder
          const { error: reminderError } = await supabase.functions.invoke('whatsapp-automations', {
            body: {
              appointment_id: appointment.id,
              trigger_type: 'appointment_reminder_1h'
            }
          });

          if (reminderError) {
            console.error(`Error sending 1h reminder for appointment ${appointment.id}:`, reminderError);
          } else {
            console.log(`1h reminder sent for appointment ${appointment.id}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_24h: appointments24h?.length || 0,
        reminders_1h: appointments1h?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in whatsapp-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});