import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientPatterns, scheduleInsights, barbershopId } = await req.json();
    
    console.log('Processing AI analytics for barbershop:', barbershopId);
    console.log('Client patterns:', clientPatterns?.length || 0);
    console.log('Schedule insights:', scheduleInsights?.length || 0);

    // Analisar padrões de clientes para previsões
    const highRiskClients = clientPatterns.filter((client: ClientPattern) => client.churnRisk === 'high');
    const mediumRiskClients = clientPatterns.filter((client: ClientPattern) => client.churnRisk === 'medium');
    
    // Calcular receita prevista baseada nos padrões
    const totalLifetimeValue = clientPatterns.reduce((sum: number, client: ClientPattern) => 
      sum + client.lifetimeValue, 0);
    
    const averageVisitValue = totalLifetimeValue / clientPatterns.reduce((sum: number, client: ClientPattern) => 
      sum + client.totalVisits, 1);

    const monthlyPredictedVisits = clientPatterns.reduce((sum: number, client: ClientPattern) => {
      const visitsPerMonth = 30 / (client.averageCycle || 30);
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
    const lowOccupancySlots = scheduleInsights.filter((slot: ScheduleInsight) => 
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
    const frequentClients = clientPatterns
      .filter((client: ClientPattern) => client.totalVisits >= 3 && client.churnRisk === 'low')
      .sort((a: ClientPattern, b: ClientPattern) => b.lifetimeValue - a.lifetimeValue)
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
        averageClientCycle: Math.round(
          clientPatterns.reduce((sum: number, client: ClientPattern) => 
            sum + client.averageCycle, 0) / clientPatterns.length
        ),
        averageLifetimeValue: Math.round(totalLifetimeValue / clientPatterns.length),
        retentionRate: Math.round(
          ((clientPatterns.length - highRiskClients.length) / clientPatterns.length) * 100
        ),
        mostProfitableDay: findMostProfitableDay(scheduleInsights),
        leastProfitableDay: findLeastProfitableDay(scheduleInsights)
      }
    };

    console.log('Generated predictions:', predictions);

    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-analytics function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      predictions: null 
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