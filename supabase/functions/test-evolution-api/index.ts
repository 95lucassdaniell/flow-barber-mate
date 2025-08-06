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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Evolution API credentials not configured'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { barbershopId, testType = 'all' } = await req.json();

    const results: any = {
      timestamp: new Date().toISOString(),
      barbershopId,
      tests: {}
    };

    // Test 1: Check if Evolution API is accessible
    if (testType === 'all' || testType === 'api_connectivity') {
      try {
        console.log('Testing Evolution API connectivity...');
        console.log(`Base URL: ${evolutionApiUrl}`);
        console.log(`Using API Key: ${evolutionApiKey.substring(0, 10)}...`);
        
        // Test different possible endpoints
        const endpoints = [
          '/instance/fetchInstances',
          '/instances',
          '/manager/fetchInstances',
          '/api/instance/fetchInstances',
          '/v1/instance/fetchInstances'
        ];
        
        let connectivityResponse: Response | null = null;
        let workingEndpoint = '';
        
        for (const endpoint of endpoints) {
          const testUrl = `${evolutionApiUrl}${endpoint}`;
          console.log(`Testing endpoint: ${testUrl}`);
          
          try {
            const response = await fetch(testUrl, {
              method: 'GET',
              headers: {
                'apikey': evolutionApiKey,
                'Content-Type': 'application/json'
              }
            });
            
            console.log(`${endpoint} - Status: ${response.status}`);
            
            // If we get a successful response or 401 (which means endpoint exists but auth might be wrong)
            if (response.ok || response.status === 401) {
              connectivityResponse = response;
              workingEndpoint = endpoint;
              console.log(`Found working endpoint: ${endpoint}`);
              break;
            }
          } catch (error) {
            console.log(`${endpoint} - Error: ${error.message}`);
            continue;
          }
        }
        
        if (!connectivityResponse) {
          // If no endpoint worked, try the base URL to see what we get
          console.log('Testing base URL without endpoint...');
          connectivityResponse = await fetch(evolutionApiUrl, {
            method: 'GET',
            headers: {
              'apikey': evolutionApiKey,
              'Content-Type': 'application/json'
            }
          });
          workingEndpoint = 'base';
        }

        console.log(`Response status: ${connectivityResponse.status}`);
        console.log(`Response headers:`, Object.fromEntries(connectivityResponse.headers.entries()));

        const responseText = await connectivityResponse.text();
        console.log(`Response body (first 500 chars): ${responseText.substring(0, 500)}`);
        
        if (connectivityResponse.ok) {
          try {
            const instances = JSON.parse(responseText);
            results.tests.api_connectivity = {
              success: true,
              status: connectivityResponse.status,
              message: 'Evolution API is accessible',
              instanceCount: instances.length,
              instances: instances,
              api_url: evolutionApiUrl,
              working_endpoint: workingEndpoint,
              tested_endpoints: endpoints
            };
          } catch (parseError) {
            results.tests.api_connectivity = {
              success: false,
              status: connectivityResponse.status,
              message: 'Evolution API returned invalid JSON',
              error: `Parse error: ${parseError.message}`,
              response_preview: responseText.substring(0, 200),
              api_url: evolutionApiUrl,
              troubleshooting: 'The API returned HTML instead of JSON. Check if the URL is correct and the API is running.'
            };
          }
        } else {
          results.tests.api_connectivity = {
            success: false,
            status: connectivityResponse.status,
            message: 'Evolution API is not accessible',
            error: responseText,
            api_url: evolutionApiUrl,
            troubleshooting: connectivityResponse.status === 404 
              ? 'API endpoint not found. Check if the URL path is correct.'
              : connectivityResponse.status === 401 
              ? 'Authentication failed. Check if the API key is correct.'
              : 'Server error. Check if the Evolution API is running properly.'
          };
        }
      } catch (error) {
        results.tests.api_connectivity = {
          success: false,
          error: error.message,
          message: 'Failed to connect to Evolution API',
          api_url: evolutionApiUrl,
          troubleshooting: error.message.includes('fetch')
            ? 'Network error. Check if the Evolution API URL is accessible and the server is running.'
            : 'Unexpected error occurred during API call.'
        };
      }
    }

    // Test 2: Check WhatsApp instance in database
    if (testType === 'all' || testType === 'database_instance') {
      try {
        console.log('Checking WhatsApp instance in database...');
        const { data: whatsappInstance, error } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('barbershop_id', barbershopId)
          .single();

        if (error) {
          results.tests.database_instance = {
            success: false,
            error: error.message,
            message: 'WhatsApp instance not found in database'
          };
        } else {
          results.tests.database_instance = {
            success: true,
            instance: whatsappInstance,
            message: 'WhatsApp instance found in database'
          };
        }
      } catch (error) {
        results.tests.database_instance = {
          success: false,
          error: error.message,
          message: 'Database query failed'
        };
      }
    }

    // Test 3: Check if instance exists in Evolution API
    if (testType === 'all' || testType === 'evolution_instance') {
      try {
        console.log('Checking instance in Evolution API...');
        const { data: whatsappInstance } = await supabase
          .from('whatsapp_instances')
          .select('evolution_instance_name')
          .eq('barbershop_id', barbershopId)
          .single();

        if (whatsappInstance?.evolution_instance_name) {
          const instanceResponse = await fetch(`${evolutionApiUrl}/instance/fetchInstances?instanceName=${whatsappInstance.evolution_instance_name}`, {
            method: 'GET',
            headers: {
              'apikey': evolutionApiKey,
              'Content-Type': 'application/json'
            }
          });

          if (instanceResponse.ok) {
            const instanceData = await instanceResponse.json();
            results.tests.evolution_instance = {
              success: true,
              instance: instanceData,
              message: 'Instance found in Evolution API'
            };
          } else {
            results.tests.evolution_instance = {
              success: false,
              status: instanceResponse.status,
              message: 'Instance not found in Evolution API'
            };
          }
        } else {
          results.tests.evolution_instance = {
            success: false,
            message: 'No instance name configured'
          };
        }
      } catch (error) {
        results.tests.evolution_instance = {
          success: false,
          error: error.message,
          message: 'Failed to check instance in Evolution API'
        };
      }
    }

    // Test 4: Test webhook endpoint
    if (testType === 'all' || testType === 'webhook_test') {
      try {
        console.log('Testing webhook endpoint...');
        const webhookUrl = `${supabaseUrl}/functions/v1/evolution-webhook`;
        
        const testPayload = {
          instance: 'test',
          data: {
            event: 'test.connection',
            key: {
              remoteJid: 'test@test.com'
            },
            message: {
              conversation: 'Test message for webhook connectivity'
            }
          }
        };

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify(testPayload)
        });

        results.tests.webhook_test = {
          success: webhookResponse.ok,
          status: webhookResponse.status,
          message: webhookResponse.ok ? 'Webhook endpoint is accessible' : 'Webhook endpoint failed',
          url: webhookUrl
        };

        if (!webhookResponse.ok) {
          results.tests.webhook_test.responseText = await webhookResponse.text();
        }
      } catch (error) {
        results.tests.webhook_test = {
          success: false,
          error: error.message,
          message: 'Failed to test webhook endpoint'
        };
      }
    }

    // Test 5: Check recent webhook calls
    if (testType === 'all' || testType === 'webhook_logs') {
      try {
        console.log('Checking recent messages...');
        const { data: recentMessages, error } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('barbershop_id', barbershopId)
          .order('created_at', { ascending: false })
          .limit(5);

        results.tests.webhook_logs = {
          success: !error,
          recentMessages: recentMessages || [],
          messageCount: recentMessages?.length || 0,
          message: `Found ${recentMessages?.length || 0} recent messages`
        };
      } catch (error) {
        results.tests.webhook_logs = {
          success: false,
          error: error.message,
          message: 'Failed to check recent messages'
        };
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in test-evolution-api:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});