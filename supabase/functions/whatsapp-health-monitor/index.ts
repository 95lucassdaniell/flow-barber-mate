import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    console.log('=== WHATSAPP HEALTH MONITOR STARTED ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')!;
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action = 'health_check', barbershop_id } = await req.json();
    console.log('Health monitor action:', action);

    switch (action) {
      case 'health_check':
        return await performHealthCheck(supabase, evolutionApiUrl, evolutionApiKey, barbershop_id);
      
      case 'fix_webhook':
        return await fixWebhookConfiguration(supabase, evolutionApiUrl, evolutionApiKey, barbershop_id);
      
      case 'test_webhook':
        return await testWebhookConnectivity(supabase, evolutionApiUrl, evolutionApiKey, barbershop_id);
      
      case 'full_recovery':
        return await performFullRecovery(supabase, evolutionApiUrl, evolutionApiKey, barbershop_id);
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action',
          available_actions: ['health_check', 'fix_webhook', 'test_webhook', 'full_recovery']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Health monitor error:', error);
    return new Response(JSON.stringify({ 
      error: 'Health monitor failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function performHealthCheck(supabase: any, evolutionApiUrl: string, evolutionApiKey: string, barbershop_id?: string) {
  console.log('Starting health check...');
  
  // Get all active WhatsApp instances
  const { data: instances, error: instancesError } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq(barbershop_id ? 'barbershop_id' : 'status', barbershop_id || 'connected');

  if (instancesError) {
    throw new Error(`Failed to fetch instances: ${instancesError.message}`);
  }

  console.log(`Found ${instances?.length || 0} instances to check`);

  const healthReport = [];

  for (const instance of instances || []) {
    console.log(`Checking health for instance: ${instance.evolution_instance_name}`);
    
    const report = {
      instance_id: instance.id,
      instance_name: instance.evolution_instance_name,
      database_status: instance.status,
      evolution_api_status: 'unknown',
      webhook_configured: false,
      recent_messages: 0,
      issues: [],
      recommendations: []
    };

    try {
      // Check Evolution API status
      const evolutionResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
      });

      if (evolutionResponse.ok) {
        const evolutionInstances = await evolutionResponse.json();
        const evolutionInstance = evolutionInstances.find((inst: any) => 
          inst.name === instance.evolution_instance_name
        );

        if (evolutionInstance) {
          report.evolution_api_status = evolutionInstance.connectionStatus;
          
          // Check webhook configuration
          if (evolutionInstance.webhook && evolutionInstance.webhook.url) {
            report.webhook_configured = evolutionInstance.webhook.url.includes('evolution-webhook');
          }
        } else {
          report.evolution_api_status = 'not_found';
          report.issues.push('Instance not found in Evolution API');
          report.recommendations.push('Recreate instance in Evolution API');
        }
      } else {
        report.issues.push('Cannot connect to Evolution API');
        report.recommendations.push('Check Evolution API connectivity');
      }

      // Check recent messages
      const { data: messages, error: messagesError } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('barbershop_id', instance.barbershop_id)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .limit(100);

      if (!messagesError) {
        report.recent_messages = messages?.length || 0;
        
        if (report.recent_messages === 0 && report.evolution_api_status === 'open') {
          report.issues.push('No recent messages despite connection being open');
          report.recommendations.push('Check webhook configuration and test message delivery');
        }
      }

      // Status mismatch check
      if (instance.status !== report.evolution_api_status) {
        report.issues.push(`Status mismatch: DB shows ${instance.status}, Evolution API shows ${report.evolution_api_status}`);
        report.recommendations.push('Sync status between database and Evolution API');
      }

      // Webhook check
      if (!report.webhook_configured && report.evolution_api_status === 'open') {
        report.issues.push('Webhook not properly configured');
        report.recommendations.push('Reconfigure webhook URL');
      }

    } catch (error) {
      console.error(`Error checking instance ${instance.evolution_instance_name}:`, error);
      report.issues.push(`Health check failed: ${error.message}`);
      report.recommendations.push('Run full recovery process');
    }

    healthReport.push(report);
  }

  console.log('Health check completed');
  
  return new Response(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString(),
    total_instances: instances?.length || 0,
    healthy_instances: healthReport.filter(r => r.issues.length === 0).length,
    instances_with_issues: healthReport.filter(r => r.issues.length > 0).length,
    health_report: healthReport
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function fixWebhookConfiguration(supabase: any, evolutionApiUrl: string, evolutionApiKey: string, barbershop_id: string) {
  console.log('Starting webhook fix for barbershop:', barbershop_id);

  // Get the instance
  const { data: instance, error: instanceError } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('barbershop_id', barbershop_id)
    .single();

  if (instanceError || !instance) {
    throw new Error('WhatsApp instance not found');
  }

  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
  
  try {
    // Configure webhook in Evolution API
    const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instance.evolution_instance_name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        url: webhookUrl,
        enabled: true,
        events: [
          'application.startup',
          'qrcode.updated',
          'connection.update',
          'messages.upsert',
          'messages.update',
          'send.message'
        ]
      }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      throw new Error(`Failed to configure webhook: ${errorText}`);
    }

    // Update database
    await supabase
      .from('whatsapp_instances')
      .update({
        webhook_url: webhookUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', instance.id);

    console.log('Webhook configuration fixed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Webhook configuration fixed',
      webhook_url: webhookUrl,
      instance_name: instance.evolution_instance_name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fixing webhook:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fix webhook configuration',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function testWebhookConnectivity(supabase: any, evolutionApiUrl: string, evolutionApiKey: string, barbershop_id: string) {
  console.log('Testing webhook connectivity for barbershop:', barbershop_id);

  try {
    // Create a test webhook payload
    const testPayload = {
      event: 'test.connectivity',
      instance: `test_${Date.now()}`,
      data: {
        message: 'Test webhook connectivity',
        timestamp: new Date().toISOString(),
        test_id: `test_${Math.random()}`
      }
    };

    // Send test webhook to our endpoint
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;
    
    const testResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await testResponse.text();
    
    return new Response(JSON.stringify({
      success: true,
      webhook_reachable: testResponse.ok,
      webhook_response_status: testResponse.status,
      webhook_response: responseText,
      test_payload: testPayload
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error testing webhook connectivity:', error);
    
    return new Response(JSON.stringify({
      success: false,
      webhook_reachable: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function performFullRecovery(supabase: any, evolutionApiUrl: string, evolutionApiKey: string, barbershop_id: string) {
  console.log('Starting full recovery for barbershop:', barbershop_id);

  const recoverySteps = [];
  let success = true;

  try {
    // Step 1: Health check
    recoverySteps.push({ step: 'health_check', status: 'running' });
    const healthCheck = await performHealthCheck(supabase, evolutionApiUrl, evolutionApiKey, barbershop_id);
    recoverySteps[0].status = 'completed';

    // Step 2: Fix webhook
    recoverySteps.push({ step: 'fix_webhook', status: 'running' });
    try {
      await fixWebhookConfiguration(supabase, evolutionApiUrl, evolutionApiKey, barbershop_id);
      recoverySteps[1].status = 'completed';
    } catch (error) {
      recoverySteps[1].status = 'failed';
      recoverySteps[1].error = error.message;
      success = false;
    }

    // Step 3: Test connectivity
    recoverySteps.push({ step: 'test_connectivity', status: 'running' });
    try {
      await testWebhookConnectivity(supabase, evolutionApiUrl, evolutionApiKey, barbershop_id);
      recoverySteps[2].status = 'completed';
    } catch (error) {
      recoverySteps[2].status = 'failed';
      recoverySteps[2].error = error.message;
    }

    // Step 4: Final health check
    recoverySteps.push({ step: 'final_health_check', status: 'running' });
    const finalHealthCheck = await performHealthCheck(supabase, evolutionApiUrl, evolutionApiKey, barbershop_id);
    recoverySteps[3].status = 'completed';

    return new Response(JSON.stringify({
      success,
      message: success ? 'Full recovery completed successfully' : 'Recovery completed with some issues',
      recovery_steps: recoverySteps,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in full recovery:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Full recovery failed',
      details: error.message,
      recovery_steps: recoverySteps
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}