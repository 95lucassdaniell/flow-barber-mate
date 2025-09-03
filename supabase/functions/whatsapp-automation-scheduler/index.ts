import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for database operations
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('WhatsApp Automation Scheduler started');

    // Get pending jobs that need to be processed
    const { data: pendingJobs, error: jobsError } = await supabaseServiceRole
      .from('whatsapp_scheduled_jobs')
      .select(`
        id,
        appointment_id,
        automation_id,
        barbershop_id,
        scheduled_for,
        attempts
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50); // Process in batches

    if (jobsError) {
      console.error('Error fetching pending jobs:', jobsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending jobs' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let failedCount = 0;

    console.log(`Found ${pendingJobs?.length || 0} pending jobs to process`);

    // Process each job
    for (const job of pendingJobs || []) {
      try {
        console.log(`Processing job ${job.id} for appointment ${job.appointment_id}`);

        // Mark job as processing to prevent race conditions
        const { error: updateError } = await supabaseServiceRole
          .from('whatsapp_scheduled_jobs')
          .update({ 
            status: 'processing',
            attempts: job.attempts + 1
          })
          .eq('id', job.id);

        if (updateError) {
          console.error(`Error updating job ${job.id} to processing:`, updateError);
          continue;
        }

        // Call the whatsapp-automations function
        const { data: automationResult, error: automationError } = await supabaseServiceRole.functions
          .invoke('whatsapp-automations', {
            body: {
              appointment_id: job.appointment_id,
              automation_id: job.automation_id,
              scheduled_job_id: job.id
            }
          });

        if (automationError) {
          console.error(`Error calling whatsapp-automations for job ${job.id}:`, automationError);
          
          // Mark job as failed
          await supabaseServiceRole
            .from('whatsapp_scheduled_jobs')
            .update({ 
              status: 'failed',
              last_error: automationError.message || 'Unknown error',
              processed_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          failedCount++;
        } else {
          console.log(`Successfully processed job ${job.id}`);
          
          // Mark job as sent
          await supabaseServiceRole
            .from('whatsapp_scheduled_jobs')
            .update({ 
              status: 'sent',
              processed_at: new Date().toISOString()
            })
            .eq('id', job.id);
          
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        
        // Mark job as failed
        await supabaseServiceRole
          .from('whatsapp_scheduled_jobs')
          .update({ 
            status: 'failed',
            last_error: error.message || 'Processing error',
            processed_at: new Date().toISOString()
          })
          .eq('id', job.id);
        
        failedCount++;
      }
    }

    console.log(`Scheduler completed: ${processedCount} processed, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: processedCount,
        failed: failedCount,
        total: pendingJobs?.length || 0
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in whatsapp-automation-scheduler:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});