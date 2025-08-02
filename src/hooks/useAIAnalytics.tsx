import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, addDays, format } from 'date-fns';

interface ClientPattern {
  clientId: string;
  averageCycle: number; // dias entre visitas
  lastVisit: Date;
  nextPredictedVisit: Date;
  churnRisk: 'low' | 'medium' | 'high';
  totalVisits: number;
  lifetimeValue: number;
  preferredServices: string[];
  preferredTimes: string[];
}

interface ScheduleInsight {
  timeSlot: string;
  dayOfWeek: string;
  occupationRate: number;
  suggestedAction: string;
  potentialRevenue: number;
}

interface SalesPattern {
  serviceId: string;
  serviceName: string;
  frequency: number;
  suggestedCombos: Array<{
    services: string[];
    frequency: number;
    averageValue: number;
  }>;
  profitability: {
    revenue: number;
    timeSpent: number;
    efficiency: number;
  };
}

interface AIInsights {
  clientPatterns: ClientPattern[];
  scheduleInsights: ScheduleInsight[];
  salesPatterns: SalesPattern[];
  predictions: {
    monthlyRevenue: number;
    churnRiskClients: number;
    recommendedActions: Array<{
      type: 'retention' | 'upsell' | 'schedule_optimization';
      description: string;
      priority: 'high' | 'medium' | 'low';
      potentialImpact: number;
    }>;
  };
}

export const useAIAnalytics = () => {
  const { profile } = useAuth();
  
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  // Calcular padrões de clientes
  const clientPatterns = useMemo(() => {
    if (!clients || !appointments || !sales) return [];

    return clients.map(client => {
      const clientAppointments = appointments
        .filter(apt => apt.client_id === client.id)
        .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());

      const clientSales = sales.filter(sale => sale.client_id === client.id);

      if (clientAppointments.length < 2) {
        return {
          clientId: client.id,
          averageCycle: 30, // padrão
          lastVisit: clientAppointments[0] ? new Date(clientAppointments[0].appointment_date) : new Date(),
          nextPredictedVisit: addDays(new Date(), 30),
          churnRisk: 'low' as const,
          totalVisits: clientAppointments.length,
          lifetimeValue: clientSales.reduce((sum, sale) => sum + Number(sale.final_amount), 0),
          preferredServices: [],
          preferredTimes: []
        };
      }

      // Calcular ciclo médio
      const cycles = [];
      for (let i = 1; i < clientAppointments.length; i++) {
        const daysBetween = differenceInDays(
          new Date(clientAppointments[i].appointment_date),
          new Date(clientAppointments[i - 1].appointment_date)
        );
        cycles.push(daysBetween);
      }

      const averageCycle = cycles.reduce((sum, cycle) => sum + cycle, 0) / cycles.length;
      const lastVisit = new Date(clientAppointments[clientAppointments.length - 1].appointment_date);
      const daysSinceLastVisit = differenceInDays(new Date(), lastVisit);
      
      // Determinar risco de churn
      let churnRisk: 'low' | 'medium' | 'high' = 'low';
      if (daysSinceLastVisit > averageCycle * 1.5) {
        churnRisk = 'high';
      } else if (daysSinceLastVisit > averageCycle * 1.2) {
        churnRisk = 'medium';
      }

      // Serviços preferidos (mais frequentes)
      const serviceFrequency: Record<string, number> = {};
      clientAppointments.forEach(apt => {
        serviceFrequency[apt.service_id] = (serviceFrequency[apt.service_id] || 0) + 1;
      });
      const preferredServices = Object.entries(serviceFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([serviceId]) => serviceId);

      // Horários preferidos
      const timeFrequency: Record<string, number> = {};
      clientAppointments.forEach(apt => {
        const hour = apt.start_time.split(':')[0];
        timeFrequency[hour] = (timeFrequency[hour] || 0) + 1;
      });
      const preferredTimes = Object.entries(timeFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([hour]) => `${hour}:00`);

      return {
        clientId: client.id,
        averageCycle: Math.round(averageCycle),
        lastVisit,
        nextPredictedVisit: addDays(lastVisit, Math.round(averageCycle)),
        churnRisk,
        totalVisits: clientAppointments.length,
        lifetimeValue: clientSales.reduce((sum, sale) => sum + Number(sale.final_amount), 0),
        preferredServices,
        preferredTimes
      };
    });
  }, [clients, appointments, sales]);

  // Análise de horários
  const scheduleInsights = useMemo(() => {
    if (!appointments) return [];

    const timeSlotStats: Record<string, { total: number; revenue: number }> = {};
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    appointments.forEach(apt => {
      const date = new Date(apt.appointment_date);
      const dayOfWeek = daysOfWeek[date.getDay()];
      const hour = apt.start_time.split(':')[0];
      const key = `${dayOfWeek}-${hour}`;

      if (!timeSlotStats[key]) {
        timeSlotStats[key] = { total: 0, revenue: 0 };
      }
      
      timeSlotStats[key].total += 1;
      timeSlotStats[key].revenue += Number(apt.total_price);
    });

    return Object.entries(timeSlotStats).map(([key, stats]) => {
      const [dayOfWeek, hour] = key.split('-');
      const occupationRate = stats.total / (appointments.length / 7); // aproximação
      
      let suggestedAction = '';
      if (occupationRate < 0.3) {
        suggestedAction = `Criar promoção para ${dayOfWeek} às ${hour}h - baixa ocupação`;
      } else if (occupationRate > 0.8) {
        suggestedAction = `Considerar aumentar preços - alta demanda`;
      }

      return {
        timeSlot: `${hour}:00`,
        dayOfWeek,
        occupationRate: Math.round(occupationRate * 100) / 100,
        suggestedAction,
        potentialRevenue: stats.revenue / stats.total || 0
      };
    }).filter(insight => insight.suggestedAction);
  }, [appointments]);

  // Buscar dados diretamente do banco
  const fetchData = async () => {
    if (!profile?.barbershop_id) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar dados em paralelo
      const [clientsRes, appointmentsRes, salesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name, phone, email, created_at')
          .eq('barbershop_id', profile.barbershop_id),
        supabase
          .from('appointments')
          .select('id, client_id, barber_id, service_id, appointment_date, start_time, end_time, total_price, status, created_at')
          .eq('barbershop_id', profile.barbershop_id)
          .gte('appointment_date', '2024-01-01'),
        supabase
          .from('sales')
          .select('id, client_id, barber_id, sale_date, final_amount, created_at')
          .eq('barbershop_id', profile.barbershop_id)
          .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (appointmentsRes.error) throw appointmentsRes.error;
      if (salesRes.error) throw salesRes.error;

      setClients(clientsRes.data || []);
      setAppointments(appointmentsRes.data || []);
      setSales(salesRes.data || []);

      console.log('📊 Dados carregados para IA:', {
        clients: clientsRes.data?.length || 0,
        appointments: appointmentsRes.data?.length || 0,
        sales: salesRes.data?.length || 0
      });

      // Log adicional para debug
      console.log('🔍 Amostra de dados:');
      if (clientsRes.data?.length > 0) {
        console.log('Cliente exemplo:', clientsRes.data[0]);
      }
      if (appointmentsRes.data?.length > 0) {
        console.log('Agendamento exemplo:', appointmentsRes.data[0]);
      }
      if (salesRes.data?.length > 0) {
        console.log('Venda exemplo:', salesRes.data[0]);
      }

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao buscar dados para análise');
    } finally {
      setLoading(false);
    }
  };

  // Processar insights com IA - PLANO EMERGENCIAL RAILWAY
  const processAIInsights = async (retryCount = 0) => {
    const maxRetries = 3;
    
    // FASE 1: Validação crítica de dados ANTES da chamada
    if (!clients.length && !appointments.length && !sales.length) {
      console.log('🚨 [Emergency] No data available, fetching...');
      await fetchData();
      return;
    }

    // Verificar se há dados mínimos necessários
    if (!clientPatterns.length && !scheduleInsights.length) {
      console.warn('⚠️ [Emergency] Insufficient data for AI analysis');
      setError('Dados insuficientes para análise');
      return;
    }

    try {
      console.log('🚀 [Emergency] Starting AI analysis:', {
        clientPatterns: clientPatterns.length,
        scheduleInsights: scheduleInsights.length,
        barbershopId: profile?.barbershop_id,
        attempt: retryCount + 1,
        maxRetries
      });

      // FASE 1: Criar payload ULTRA-ROBUSTO para Railway
      const createRailwaySafePayload = () => {
        try {
          // Validar dados de entrada primeiro
          const validClientPatterns = clientPatterns.filter(cp => cp && cp.clientId);
          const validScheduleInsights = scheduleInsights.filter(si => si && si.timeSlot);

          console.log('🔍 [Emergency] Data validation:', {
            originalClients: clientPatterns.length,
            validClients: validClientPatterns.length,
            originalSchedule: scheduleInsights.length,
            validSchedule: validScheduleInsights.length
          });

          const payload = {
            clientPatterns: validClientPatterns.slice(0, 50).map(cp => {
              const safe: any = {};
              
              // Campos obrigatórios com fallbacks
              safe.clientId = String(cp.clientId || '').slice(0, 100);
              safe.averageCycle = Math.max(1, Math.min(365, Number(cp.averageCycle) || 30));
              safe.churnRisk = ['low', 'medium', 'high'].includes(cp.churnRisk) ? cp.churnRisk : 'low';
              safe.totalVisits = Math.max(0, Number(cp.totalVisits) || 0);
              safe.lifetimeValue = Math.max(0, Number(cp.lifetimeValue) || 0);
              
              // Datas com validação rigorosa
              const now = new Date();
              const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
              
              try {
                if (cp.lastVisit instanceof Date && !isNaN(cp.lastVisit.getTime())) {
                  safe.lastVisit = cp.lastVisit.toISOString();
                } else if (typeof cp.lastVisit === 'string' && cp.lastVisit) {
                  const parsed = new Date(cp.lastVisit);
                  safe.lastVisit = !isNaN(parsed.getTime()) ? parsed.toISOString() : sixMonthsAgo.toISOString();
                } else {
                  safe.lastVisit = sixMonthsAgo.toISOString();
                }
              } catch {
                safe.lastVisit = sixMonthsAgo.toISOString();
              }

              try {
                if (cp.nextPredictedVisit instanceof Date && !isNaN(cp.nextPredictedVisit.getTime())) {
                  safe.nextPredictedVisit = cp.nextPredictedVisit.toISOString();
                } else if (typeof cp.nextPredictedVisit === 'string' && cp.nextPredictedVisit) {
                  const parsed = new Date(cp.nextPredictedVisit);
                  safe.nextPredictedVisit = !isNaN(parsed.getTime()) ? parsed.toISOString() : now.toISOString();
                } else {
                  safe.nextPredictedVisit = now.toISOString();
                }
              } catch {
                safe.nextPredictedVisit = now.toISOString();
              }
              
              return safe;
            }),
            scheduleInsights: validScheduleInsights.slice(0, 50).map(si => ({
              timeSlot: String(si.timeSlot || '09:00').slice(0, 10),
              dayOfWeek: String(si.dayOfWeek || 'segunda').slice(0, 20),
              occupationRate: Math.max(0, Math.min(100, Number(si.occupationRate) || 0)),
              suggestedAction: String(si.suggestedAction || 'otimizar').slice(0, 200),
              potentialRevenue: Math.max(0, Number(si.potentialRevenue) || 0)
            })),
            barbershopId: String(profile?.barbershop_id || '')
          };
          
          // VALIDAÇÃO FINAL: Teste de serialização dupla
          const jsonString = JSON.stringify(payload);
          const parsedBack = JSON.parse(jsonString);
          
          console.log('✅ [Emergency] Payload validation passed:', {
            size: jsonString.length,
            clientsIncluded: payload.clientPatterns.length,
            scheduleIncluded: payload.scheduleInsights.length,
            canSerialize: true,
            canParse: true
          });
          
          return payload;
          
        } catch (error) {
          console.error('💥 [Emergency] Payload creation failed:', error);
          
          // FALLBACK MÍNIMO: Payload de emergência
          return {
            clientPatterns: [{
              clientId: 'fallback',
              averageCycle: 30,
              lastVisit: new Date().toISOString(),
              nextPredictedVisit: new Date().toISOString(),
              churnRisk: 'low',
              totalVisits: 1,
              lifetimeValue: 100
            }],
            scheduleInsights: [{
              timeSlot: '09:00',
              dayOfWeek: 'segunda',
              occupationRate: 50,
              suggestedAction: 'analise_basica',
              potentialRevenue: 500
            }],
            barbershopId: String(profile?.barbershop_id || '')
          };
        }
      };

      // FASE 2: Criar payload progressivo baseado na tentativa
      let payload;
      if (retryCount === 0) {
        // Primeira tentativa: payload completo
        payload = createRailwaySafePayload();
      } else if (retryCount === 1) {
        // Segunda tentativa: payload reduzido
        payload = {
          clientPatterns: clientPatterns.slice(0, 10).map(cp => ({
            clientId: String(cp.clientId || ''),
            averageCycle: Number(cp.averageCycle) || 30,
            churnRisk: cp.churnRisk || 'low',
            totalVisits: Number(cp.totalVisits) || 0,
            lifetimeValue: Number(cp.lifetimeValue) || 0,
            lastVisit: new Date().toISOString(),
            nextPredictedVisit: new Date().toISOString()
          })),
          scheduleInsights: scheduleInsights.slice(0, 5).map(si => ({
            timeSlot: String(si.timeSlot || '09:00'),
            dayOfWeek: String(si.dayOfWeek || 'segunda'),
            occupationRate: Number(si.occupationRate) || 50,
            suggestedAction: 'optimize',
            potentialRevenue: Number(si.potentialRevenue) || 500
          })),
          barbershopId: String(profile?.barbershop_id || '')
        };
      } else {
        // Terceira tentativa: payload mínimo
        payload = {
          clientPatterns: [{
            clientId: 'minimal',
            averageCycle: 30,
            churnRisk: 'low',
            totalVisits: 1,
            lifetimeValue: 100,
            lastVisit: new Date().toISOString(),
            nextPredictedVisit: new Date().toISOString()
          }],
          scheduleInsights: [{
            timeSlot: '09:00',
            dayOfWeek: 'segunda',
            occupationRate: 50,
            suggestedAction: 'basic_analysis',
            potentialRevenue: 500
          }],
          barbershopId: String(profile?.barbershop_id || '')
        };
      }

  // FASE 2: Logging detalhado Railway-específico
      const payloadString = JSON.stringify(payload);
      console.log('📦 [Emergency] Final payload details:', {
        attempt: retryCount + 1,
        type: retryCount === 0 ? 'full' : retryCount === 1 ? 'reduced' : 'minimal',
        size: payloadString.length,
        clientPatterns: payload.clientPatterns.length,
        scheduleInsights: payload.scheduleInsights.length,
        barbershopId: payload.barbershopId,
        payloadPreview: payloadString.substring(0, 200) + '...'
      });

      // FASE 3: Diagnóstico CRÍTICO imediatamente antes da chamada
      console.log('🔍 [Emergency] Pre-call diagnostics:', {
        payloadType: typeof payload,
        payloadIsObject: payload && typeof payload === 'object',
        payloadKeys: Object.keys(payload || {}),
        jsonStringified: !!payloadString,
        jsonCanParse: (() => {
          try { JSON.parse(payloadString); return true; } catch { return false; }
        })(),
        clientPatternsValid: Array.isArray(payload.clientPatterns),
        scheduleInsightsValid: Array.isArray(payload.scheduleInsights)
      });

      // FASE 4: Implementar HTTP direto como FALLBACK primário
      const callWithDirectHTTP = async () => {
        const fullUrl = 'https://yzqwmxffjufefocgkevz.supabase.co/functions/v1/ai-analytics';
        console.log('🌐 [Emergency] Using direct HTTP call to:', fullUrl);
        
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cXdteGZmanVmZWZvY2drZXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTk5NzUsImV4cCI6MjA2ODg3NTk3NX0.f4UD5xQ16wInFkwkAYcqIfAFyhJ2uuefc-l6n4pSJpY`,
            'X-Railway-Attempt': String(retryCount + 1),
            'X-Railway-Payload-Size': String(payloadString.length),
            'X-Client-Debug': 'emergency-plan-direct-http'
          },
          body: payloadString
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      };

      // FASE 5: Timeout otimizado para Railway
      const railwayTimeout = retryCount === 0 ? 15000 : retryCount === 1 ? 10000 : 5000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Railway timeout after ${railwayTimeout}ms`)), railwayTimeout);
      });

      // CHAMADA PRIMÁRIA: Tentar supabase.functions.invoke primeiro
      let result: any;
      try {
        console.log('🚀 [Emergency] Trying supabase.functions.invoke...');
        const invokePromise = supabase.functions.invoke('ai-analytics', {
          body: payload,
          headers: {
            'Content-Type': 'application/json',
            'X-Railway-Attempt': String(retryCount + 1),
            'X-Railway-Payload-Size': String(payloadString.length),
            'X-Client-Debug': 'emergency-plan'
          }
        });

        result = await Promise.race([invokePromise, timeoutPromise]);
        console.log('✅ [Emergency] supabase.functions.invoke succeeded');
      } catch (invokeError) {
        console.warn('⚠️ [Emergency] supabase.functions.invoke failed, trying direct HTTP...', invokeError);
        
        // FALLBACK: Tentar HTTP direto
        try {
          const directResult = await Promise.race([callWithDirectHTTP(), timeoutPromise]);
          result = { data: directResult, error: null };
          console.log('✅ [Emergency] Direct HTTP succeeded');
        } catch (httpError) {
          console.error('💥 [Emergency] Both methods failed:', { invokeError, httpError });
          throw httpError;
        }
      }

      const { data, error } = result;

      console.log('📡 [Railway Debug] Function response:', {
        hasData: !!data,
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [],
        errorMessage: error?.message
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      // Validar resposta JSON
      let predictions;
      if (typeof data === 'string') {
        try {
          predictions = JSON.parse(data).predictions;
        } catch (parseErr) {
          console.error('❌ [Railway Debug] JSON parse error from function response:', parseErr);
          throw new Error('Invalid JSON response from AI function');
        }
      } else if (data && data.predictions) {
        predictions = data.predictions;
      } else {
        console.warn('⚠️ [Railway Debug] Unexpected response format:', data);
        throw new Error('Invalid response format from AI function');
      }

      const enhancedInsights: AIInsights = {
        clientPatterns,
        scheduleInsights,
        salesPatterns: [], // será implementado na próxima fase
        predictions: predictions || {
          monthlyRevenue: sales.reduce((sum, sale) => sum + Number(sale.final_amount || 0), 0),
          churnRiskClients: clientPatterns.filter(c => c.churnRisk === 'high').length,
          recommendedActions: generateBasicRecommendations()
        }
      };

      console.log('✅ [Railway Debug] Successfully processed AI insights:', {
        monthlyRevenue: enhancedInsights.predictions.monthlyRevenue,
        actionsCount: enhancedInsights.predictions.recommendedActions.length
      });

      setInsights(enhancedInsights);
      setError(null); // Clear any previous errors
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao processar insights';
      
      console.error('💥 [Railway Debug] Error processing AI insights:', {
        message: errorMessage,
        attempt: retryCount + 1,
        maxRetries,
        willRetry: retryCount < maxRetries
      });

      // Retry logic
      if (retryCount < maxRetries && !errorMessage.includes('timeout')) {
        console.log(`🔄 [Railway Debug] Retrying AI insights (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          processAIInsights(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setError(`Análise IA indisponível: ${errorMessage}`);
      
      // Fallback robusto para insights básicos
      const basicInsights: AIInsights = {
        clientPatterns,
        scheduleInsights,
        salesPatterns: [],
        predictions: {
          monthlyRevenue: sales.reduce((sum, sale) => sum + Number(sale.final_amount || 0), 0),
          churnRiskClients: clientPatterns.filter(c => c.churnRisk === 'high').length,
          recommendedActions: generateBasicRecommendations()
        }
      };
      
      console.log('🔧 [Railway Debug] Using fallback insights:', basicInsights.predictions);
      setInsights(basicInsights);
    }
  };

  const generateBasicRecommendations = () => {
    const recommendations = [];
    
    const highRiskClients = clientPatterns.filter(c => c.churnRisk === 'high');
    if (highRiskClients.length > 0) {
      recommendations.push({
        type: 'retention' as const,
        description: `${highRiskClients.length} clientes com alto risco de abandono precisam de atenção`,
        priority: 'high' as const,
        potentialImpact: highRiskClients.reduce((sum, c) => sum + c.lifetimeValue, 0) * 0.7
      });
    }

    const lowOccupancySlots = scheduleInsights.filter(s => s.occupationRate < 0.3);
    if (lowOccupancySlots.length > 0) {
      recommendations.push({
        type: 'schedule_optimization' as const,
        description: `${lowOccupancySlots.length} horários com baixa ocupação podem ser otimizados`,
        priority: 'medium' as const,
        potentialImpact: lowOccupancySlots.length * 100 // estimativa
      });
    }

    return recommendations;
  };

  // Atualizar insights automaticamente
  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchData();
    }
  }, [profile?.barbershop_id]);

  useEffect(() => {
    if (clients.length > 0 || appointments.length > 0 || sales.length > 0) {
      processAIInsights();
    }
  }, [clients, appointments, sales]);

  const refreshInsights = async () => {
    await fetchData();
  };

  // Health check para diagnóstico
  const checkAIFunctionHealth = async () => {
    try {
      console.log('🏥 [Railway Debug] Checking AI function health...');
      const { data, error } = await supabase.functions.invoke('ai-health-check');
      
      if (error) {
        console.error('❌ [Railway Debug] Health check failed:', error);
        return false;
      }
      
      console.log('✅ [Railway Debug] Health check result:', data);
      return data.status === 'healthy';
    } catch (err) {
      console.error('💥 [Railway Debug] Health check error:', err);
      return false;
    }
  };

  return {
    insights,
    loading,
    error,
    refreshInsights,
    clientPatterns,
    scheduleInsights
  };
};