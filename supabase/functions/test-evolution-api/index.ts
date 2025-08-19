import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== TESTING EVOLUTION API ===');
    
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_GLOBAL_API_KEY');
    
    console.log('Environment variables:');
    console.log('- EVOLUTION_API_URL:', evolutionApiUrl || 'NOT SET');
    console.log('- EVOLUTION_GLOBAL_API_KEY:', evolutionApiKey ? 'SET' : 'NOT SET');
    
    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Environment variables not configured',
        details: {
          evolutionApiUrl: evolutionApiUrl ? 'SET' : 'MISSING',
          evolutionApiKey: evolutionApiKey ? 'SET' : 'MISSING'
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test connection by fetching instances
    console.log('Testing connection to Evolution API...');
    const testUrl = `${evolutionApiUrl}/instance/fetchInstances`;
    console.log('Test URL:', testUrl);
    
    const testResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('Test response status:', testResponse.status);
    console.log('Test response headers:', Object.fromEntries(testResponse.headers.entries()));

    const responseText = await testResponse.text();
    console.log('Test response body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      responseData = { raw: responseText };
    }

    return new Response(JSON.stringify({
      success: testResponse.ok,
      status: testResponse.status,
      url: testUrl,
      response: responseData,
      environment: {
        evolutionApiUrl: evolutionApiUrl ? `${evolutionApiUrl.substring(0, 30)}...` : 'NOT SET',
        evolutionApiKey: evolutionApiKey ? 'SET' : 'NOT SET'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error testing Evolution API:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});