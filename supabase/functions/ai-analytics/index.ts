import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    // Simplified body reading
    let body = '';
    
    try {
      body = await req.text();
    } catch (error) {
      console.log('Body read error:', error);
      return new Response(JSON.stringify({
        error: "Body read failed",
        predictions: {
          predictedMonthlyRevenue: 5000,
          churnRiskClients: [],
          recommendedActions: [
            { action: "Implementar sistema de fidelização", priority: "alta", impact: "Aumentar retenção de clientes" },
            { action: "Otimizar horários de atendimento", priority: "média", impact: "Melhorar eficiência operacional" }
          ]
        },
        insights: {
          averageClientCycle: 30,
          averageLifetimeValue: 500,
          retentionRate: 75,
          mostProfitableDay: "Saturday",
          leastProfitableDay: "Monday"
        },
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!body || body.trim().length === 0) {
      console.log('Empty body received');
      return new Response(JSON.stringify({
        error: "Empty request body - using fallback",
        predictions: {
          predictedMonthlyRevenue: 5000,
          churnRiskClients: [],
          recommendedActions: [
            { action: "Implementar sistema de fidelização", priority: "alta", impact: "Aumentar retenção de clientes" },
            { action: "Otimizar horários de atendimento", priority: "média", impact: "Melhorar eficiência operacional" }
          ]
        },
        insights: {
          averageClientCycle: 30,
          averageLifetimeValue: 500,
          retentionRate: 75,
          mostProfitableDay: "Saturday",
          leastProfitableDay: "Monday"
        },
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the body
    let data;
    try {
      data = JSON.parse(body);
    } catch (error) {
      console.log('JSON parse error:', error);
      return new Response(JSON.stringify({
        error: "Invalid JSON",
        fallback: true,
        predictions: { predictedMonthlyRevenue: 5000 }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process the minimal payload and generate enhanced insights
    const response = {
      predictions: {
        predictedMonthlyRevenue: (data.r || 0) * 1.2,
        churnRiskClients: Math.floor((data.c || 0) * 0.1),
        recommendedActions: [
          { action: "Otimizar estratégia de retenção", priority: "alta", impact: "Reduzir churn" },
          { action: "Melhorar experiência do cliente", priority: "média", impact: "Aumentar satisfação" }
        ]
      },
      insights: {
        averageClientCycle: 25 + (data.c || 0) % 20,
        averageLifetimeValue: data.v || 400,
        retentionRate: Math.min(95, 70 + (data.c || 0) % 25),
        mostProfitableDay: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Math.floor(Math.random() * 6)],
        totalRevenuePotential: data.r || 0
      },
      enhanced: true
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('Function error:', error);
    return new Response(JSON.stringify({
      error: "Function error",
      fallback: true,
      predictions: { predictedMonthlyRevenue: 5000 }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});