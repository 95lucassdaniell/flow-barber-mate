import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log('🚨 STUB: cancel-nfe function called - this is a temporary stub');
    
    // Log the request details for debugging
    const body = await req.text();
    console.log('Request body:', body);
    console.log('Request method:', req.method);
    console.log('Request headers:', JSON.stringify([...req.headers.entries()]));
    
    // Return a success response to prevent errors
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'STUB: cancel-nfe functionality not implemented. This is a temporary response to prevent errors.',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in cancel-nfe stub:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error in cancel-nfe stub',
        message: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
})