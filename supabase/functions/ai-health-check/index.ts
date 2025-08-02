import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const startTime = Date.now();
    
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: Deno.env.get('DENO_DEPLOYMENT_ID') || 'local',
      responseTime: 0,
      tests: {
        jsonParsing: false,
        basicMath: false,
        dateOperations: false
      }
    };

    // Test JSON parsing
    try {
      JSON.parse('{"test": true}');
      healthStatus.tests.jsonParsing = true;
    } catch (e) {
      console.error('JSON parsing test failed:', e);
    }

    // Test basic math operations
    try {
      const result = 2 + 2;
      healthStatus.tests.basicMath = result === 4;
    } catch (e) {
      console.error('Math test failed:', e);
    }

    // Test date operations
    try {
      new Date().toISOString();
      healthStatus.tests.dateOperations = true;
    } catch (e) {
      console.error('Date operations test failed:', e);
    }

    healthStatus.responseTime = Date.now() - startTime;

    const allTestsPassed = Object.values(healthStatus.tests).every(test => test === true);
    
    if (!allTestsPassed) {
      healthStatus.status = 'degraded';
    }

    console.log('🏥 Health check completed:', healthStatus);

    return new Response(JSON.stringify(healthStatus), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: allTestsPassed ? 200 : 206
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: Deno.env.get('DENO_DEPLOYMENT_ID') || 'local'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});