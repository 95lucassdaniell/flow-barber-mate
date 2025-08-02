import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-railway-attempt, x-railway-payload-size, x-client-debug',
};

// RAILWAY EMERGENCY LOGGING SYSTEM
function logEmergencyDebug(stage: string, data: any, requestId?: string) {
  const timestamp = new Date().toISOString();
  const prefix = `🚨 [EMERGENCY-${stage}]`;
  
  try {
    const logData = {
      timestamp,
      requestId: requestId || crypto.randomUUID().slice(0, 8),
      stage,
      environment: Deno.env.get('DENO_DEPLOYMENT_ID') || 'local',
      data: typeof data === 'object' ? JSON.stringify(data).substring(0, 500) : String(data).substring(0, 500)
    };
    console.log(prefix, logData);
  } catch (logError) {
    console.log(prefix, { timestamp, stage, error: 'Failed to log', original: String(data).substring(0, 100) });
  }
}

interface ClientPattern {
  clientId: string;
  averageCycle: number;
  lastVisit: string;
  nextPredictedVisit: string;
  churnRisk: 'low' | 'medium' | 'high';
  totalVisits: number;
  lifetimeValue: number;
}

interface ScheduleInsight {
  timeSlot: string;
  dayOfWeek: string;
  occupationRate: number;
  suggestedAction: string;
  potentialRevenue: number;
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logEmergencyDebug('CORS', 'Preflight request handled', requestId);
    return new Response(null, { headers: corsHeaders });
  }

  logEmergencyDebug('START', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  }, requestId);

  try {
    // FASE 1: DETECÇÃO RAILWAY ULTRA-ROBUSTA
    let requestBody;
    let rawBody;
    
    try {
      // Detectar Railway pelo headers
      const railwayHeaders = {
        railwayAttempt: req.headers.get('x-railway-attempt'),
        railwayPayloadSize: req.headers.get('x-railway-payload-size'),
        clientDebug: req.headers.get('x-client-debug'),
        contentLength: req.headers.get('content-length'),
        userAgent: req.headers.get('user-agent')
      };
      
      logEmergencyDebug('RAILWAY-DETECTION', railwayHeaders, requestId);
      
      // LEITURA SUPER-SEGURA DO BODY
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Body read timeout')), 5000);
      });
      
      const bodyPromise = req.text();
      rawBody = await Promise.race([bodyPromise, timeout]) as string;
      
      logEmergencyDebug('BODY-READ', {
        length: rawBody?.length || 0,
        isEmpty: !rawBody?.trim(),
        firstChars: rawBody?.substring(0, 150) || 'EMPTY',
        contentType: req.headers.get('content-type')
      }, requestId);
      
      // VALIDAÇÃO CRÍTICA: Body vazio
      if (!rawBody || !rawBody.trim()) {
        logEmergencyDebug('EMPTY-BODY-ERROR', {
          rawBody: rawBody || 'NULL',
          contentLength: req.headers.get('content-length'),
          method: req.method
        }, requestId);
        
        return new Response(JSON.stringify({ 
          error: 'Empty request body',
          details: `No data received. Content-Length: ${req.headers.get('content-length')}`,
          predictions: null,
          fallback: true,
          requestId,
          debug: {
            bodyLength: rawBody?.length || 0,
            bodyTrimmed: rawBody?.trim() || 'EMPTY',
            headers: railwayHeaders
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // PARSE JSON ULTRA-ROBUSTO
      try {
        requestBody = JSON.parse(rawBody);
        logEmergencyDebug('JSON-PARSE-SUCCESS', {
          hasClientPatterns: Array.isArray(requestBody?.clientPatterns),
          clientPatternsLength: requestBody?.clientPatterns?.length || 0,
          hasScheduleInsights: Array.isArray(requestBody?.scheduleInsights),
          scheduleInsightsLength: requestBody?.scheduleInsights?.length || 0,
          hasBarbershopId: !!requestBody?.barbershopId,
          bodyKeys: Object.keys(requestBody || {})
        }, requestId);
      } catch (jsonError) {
        logEmergencyDebug('JSON-PARSE-ERROR', {
          error: jsonError.message,
          rawBodyLength: rawBody.length,
          rawBodySample: rawBody.substring(0, 300),
          isValidString: typeof rawBody === 'string',
          startsWithBrace: rawBody.trim().startsWith('{'),
          endsWithBrace: rawBody.trim().endsWith('}')
        }, requestId);
        
        return new Response(JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: `JSON parse failed: ${jsonError.message}`,
          predictions: null,
          fallback: true,
          requestId,
          debug: {
            jsonError: jsonError.message,
            bodyPreview: rawBody.substring(0, 200),
            bodyLength: rawBody.length
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
    } catch (bodyReadError) {
      logEmergencyDebug('BODY-READ-ERROR', {
        error: bodyReadError.message,
        stack: bodyReadError.stack
      }, requestId);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to read request body',
        details: bodyReadError.message,
        predictions: null,
        fallback: true,
        requestId
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { clientPatterns, scheduleInsights, barbershopId } = requestBody;
    
    // Validação de dados obrigatórios
    if (!barbershopId) {
      console.error('❌ Missing barbershopId');
      return new Response(JSON.stringify({ 
        error: 'barbershopId is required',
        predictions: null,
        fallback: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validação e sanitização dos arrays
    const safeClientPatterns = Array.isArray(clientPatterns) ? clientPatterns : [];
    const safeScheduleInsights = Array.isArray(scheduleInsights) ? scheduleInsights : [];
    
    console.log('🔍 [Railway Debug] Processing AI analytics for barbershop:', barbershopId);
    console.log('📊 [Railway Debug] Client patterns:', safeClientPatterns.length);
    console.log('⏰ [Railway Debug] Schedule insights:', safeScheduleInsights.length);
    console.log('🌐 [Railway Debug] Environment check:', Deno.env.get('DENO_DEPLOYMENT_ID') || 'local');

    // Verificar se há dados suficientes
    if (safeClientPatterns.length === 0 && safeScheduleInsights.length === 0) {
      console.warn('⚠️ [Railway Debug] Insufficient data for analysis');
      return new Response(JSON.stringify({ 
        predictions: {
          monthlyRevenue: 0,
          churnRiskClients: 0,
          recommendedActions: [{
            type: 'data_collection',
            description: 'Dados insuficientes para análise. Continue usando o sistema para gerar insights.',
            priority: 'low',
            potentialImpact: 0,
            details: {
              message: 'Quando houver mais dados de clientes e agendamentos, análises mais precisas serão geradas.'
            }
          }],
          insights: {
            averageClientCycle: 30,
            averageLifetimeValue: 0,
            retentionRate: 100,
            mostProfitableDay: 'N/A',
            leastProfitableDay: 'N/A'
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Analisar padrões de clientes para previsões (usando dados sanitizados)
    const highRiskClients = safeClientPatterns.filter((client: ClientPattern) => client.churnRisk === 'high');
    const mediumRiskClients = safeClientPatterns.filter((client: ClientPattern) => client.churnRisk === 'medium');
    
    // Calcular receita prevista baseada nos padrões (com proteção contra divisão por zero)
    const totalLifetimeValue = safeClientPatterns.reduce((sum: number, client: ClientPattern) => 
      sum + (client.lifetimeValue || 0), 0);
    
    const totalVisits = safeClientPatterns.reduce((sum: number, client: ClientPattern) => 
      sum + (client.totalVisits || 0), 0);
    
    const averageVisitValue = totalVisits > 0 ? totalLifetimeValue / totalVisits : 0;

    const monthlyPredictedVisits = safeClientPatterns.reduce((sum: number, client: ClientPattern) => {
      const cycle = client.averageCycle || 30;
      const visitsPerMonth = cycle > 0 ? 30 / cycle : 1;
      return sum + visitsPerMonth;
    }, 0);

    const predictedMonthlyRevenue = monthlyPredictedVisits * averageVisitValue;

    // Gerar recomendações inteligentes
    const recommendedActions = [];

    // Recomendações para retenção
    if (highRiskClients.length > 0) {
      const potentialLoss = highRiskClients.reduce((sum: number, client: ClientPattern) => 
        sum + (client.lifetimeValue * 0.7), 0);
      
      recommendedActions.push({
        type: 'retention',
        description: `Campanha de retenção urgente para ${highRiskClients.length} clientes em alto risco`,
        priority: 'high',
        potentialImpact: potentialLoss,
        details: {
          clientIds: highRiskClients.map(c => c.clientId),
          suggestedDiscount: '15-20%',
          suggestedMessage: 'Sentimos sua falta! Volte com desconto especial.',
          expectedRetention: '60%'
        }
      });
    }

    if (mediumRiskClients.length > 0) {
      recommendedActions.push({
        type: 'retention',
        description: `Lembrete proativo para ${mediumRiskClients.length} clientes em risco médio`,
        priority: 'medium',
        potentialImpact: mediumRiskClients.reduce((sum: number, client: ClientPattern) => 
          sum + (client.lifetimeValue * 0.3), 0),
        details: {
          clientIds: mediumRiskClients.map(c => c.clientId),
          suggestedMessage: 'Está na hora de cuidar do visual! Que tal agendar?',
          expectedRetention: '80%'
        }
      });
    }

    // Recomendações para otimização de horários
    const lowOccupancySlots = safeScheduleInsights.filter((slot: ScheduleInsight) => 
      slot.occupationRate < 0.3);
    
    if (lowOccupancySlots.length > 0) {
      const potentialRevenue = lowOccupancySlots.reduce((sum: number, slot: ScheduleInsight) => 
        sum + (slot.potentialRevenue * 0.5), 0) * 4; // mensal
      
      recommendedActions.push({
        type: 'schedule_optimization',
        description: `Criar promoções para ${lowOccupancySlots.length} horários de baixa ocupação`,
        priority: 'medium',
        potentialImpact: potentialRevenue,
        details: {
          slots: lowOccupancySlots.map(slot => ({
            day: slot.dayOfWeek,
            time: slot.timeSlot,
            currentOccupation: `${Math.round(slot.occupationRate * 100)}%`,
            suggestedDiscount: '20%'
          })),
          suggestedPromotion: 'Happy Hour com 20% de desconto'
        }
      });
    }

    // Recomendações para upsell
    const frequentClients = safeClientPatterns
      .filter((client: ClientPattern) => (client.totalVisits || 0) >= 3 && client.churnRisk === 'low')
      .sort((a: ClientPattern, b: ClientPattern) => (b.lifetimeValue || 0) - (a.lifetimeValue || 0))
      .slice(0, 10);

    if (frequentClients.length > 0) {
      recommendedActions.push({
        type: 'upsell',
        description: `Oportunidade de upsell para ${frequentClients.length} clientes VIP`,
        priority: 'medium',
        potentialImpact: frequentClients.length * averageVisitValue * 0.3,
        details: {
          clientIds: frequentClients.map(c => c.clientId),
          suggestedServices: ['Combo Premium', 'Pacote Mensal'],
          expectedConversion: '25%'
        }
      });
    }

    // Ordenar recomendações por impacto
    recommendedActions.sort((a, b) => b.potentialImpact - a.potentialImpact);

    const predictions = {
      monthlyRevenue: Math.round(predictedMonthlyRevenue),
      churnRiskClients: highRiskClients.length + mediumRiskClients.length,
      recommendedActions: recommendedActions.slice(0, 5), // Top 5 recomendações
      insights: {
        averageClientCycle: safeClientPatterns.length > 0 ? Math.round(
          safeClientPatterns.reduce((sum: number, client: ClientPattern) => 
            sum + (client.averageCycle || 30), 0) / safeClientPatterns.length
        ) : 30,
        averageLifetimeValue: safeClientPatterns.length > 0 ? Math.round(totalLifetimeValue / safeClientPatterns.length) : 0,
        retentionRate: safeClientPatterns.length > 0 ? Math.round(
          ((safeClientPatterns.length - highRiskClients.length) / safeClientPatterns.length) * 100
        ) : 100,
        mostProfitableDay: findMostProfitableDay(safeScheduleInsights),
        leastProfitableDay: findLeastProfitableDay(safeScheduleInsights)
      }
    };

    console.log('✅ [Railway Debug] Generated predictions successfully:', {
      monthlyRevenue: predictions.monthlyRevenue,
      actionsCount: predictions.recommendedActions.length,
      clientsAnalyzed: safeClientPatterns.length,
      slotsAnalyzed: safeScheduleInsights.length
    });

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 [Railway Debug] Critical error in ai-analytics function:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      environment: Deno.env.get('DENO_DEPLOYMENT_ID') || 'local'
    });
    
    // Fallback seguro com dados válidos
    const fallbackPredictions = {
      monthlyRevenue: 0,
      churnRiskClients: 0,
      recommendedActions: [{
        type: 'system_error',
        description: 'Erro temporário no sistema de análise. Tente novamente em alguns minutos.',
        priority: 'low',
        potentialImpact: 0,
        details: {
          error: 'Falha na função de IA - usando dados de fallback',
          timestamp: new Date().toISOString()
        }
      }],
      insights: {
        averageClientCycle: 30,
        averageLifetimeValue: 0,
        retentionRate: 100,
        mostProfitableDay: 'N/A',
        leastProfitableDay: 'N/A'
      }
    };
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      predictions: fallbackPredictions,
      fallback: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function findMostProfitableDay(scheduleInsights: ScheduleInsight[]): string {
  const dayRevenue: Record<string, number> = {};
  
  scheduleInsights.forEach(insight => {
    if (!dayRevenue[insight.dayOfWeek]) {
      dayRevenue[insight.dayOfWeek] = 0;
    }
    dayRevenue[insight.dayOfWeek] += insight.potentialRevenue * insight.occupationRate;
  });

  const sortedDays = Object.entries(dayRevenue).sort(([,a], [,b]) => b - a);
  return sortedDays[0]?.[0] || 'N/A';
}

function findLeastProfitableDay(scheduleInsights: ScheduleInsight[]): string {
  const dayRevenue: Record<string, number> = {};
  
  scheduleInsights.forEach(insight => {
    if (!dayRevenue[insight.dayOfWeek]) {
      dayRevenue[insight.dayOfWeek] = 0;
    }
    dayRevenue[insight.dayOfWeek] += insight.potentialRevenue * insight.occupationRate;
  });

  const sortedDays = Object.entries(dayRevenue).sort(([,a], [,b]) => a - b);
  return sortedDays[0]?.[0] || 'N/A';
}