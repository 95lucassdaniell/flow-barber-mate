import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HistoricalDataConfig {
  barbershopId: string;
  clientsToCreate: number;
  appointmentsToCreate: number;
  startDate: string; // 6 months ago
  endDate: string; // 1 month ahead
  preserveExisting: boolean;
}

interface TestResult {
  phase: string;
  duration: number;
  recordsCreated: number;
  errors: number;
  avgResponseTime: number;
}

interface HistoricalDataSummary {
  testConfig: HistoricalDataConfig;
  results: TestResult[];
  summary: {
    totalDuration: number;
    totalRecords: number;
    totalErrors: number;
    recordsPerSecond: number;
    errorRate: number;
  };
  timestamp: string;
}

export const useHistoricalDataGenerator = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<HistoricalDataSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateHistoricalData = async (config: HistoricalDataConfig): Promise<HistoricalDataSummary> => {
    setIsRunning(true);
    setError(null);
    setProgress(0);
    setCurrentPhase('Iniciando geração de dados históricos...');

    try {
      // Call the edge function to generate historical data
      const { data, error: invokeError } = await supabase.functions.invoke('historical-data-generator', {
        body: { config }
      });

      if (invokeError) throw invokeError;

      setResults(data);
      setProgress(100);
      setCurrentPhase('Geração concluída com sucesso');
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupHistoricalData = async (barbershopId: string) => {
    setIsRunning(true);
    setCurrentPhase('Limpando dados históricos...');
    
    try {
      // Delete appointments first (due to foreign key constraints)
      const { error: appointmentsError } = await supabase
        .from('appointments')
        .delete()
        .eq('barbershop_id', barbershopId);

      if (appointmentsError) throw appointmentsError;

      // Delete sales
      const { error: salesError } = await supabase
        .from('sales')
        .delete()
        .eq('barbershop_id', barbershopId);

      if (salesError) throw salesError;

      // Delete commands  
      const { error: commandsError } = await supabase
        .from('commands')
        .delete()
        .eq('barbershop_id', barbershopId);

      if (commandsError) throw commandsError;

      // Delete clients
      const { error: clientsError } = await supabase
        .from('clients')
        .delete()
        .eq('barbershop_id', barbershopId);

      if (clientsError) throw clientsError;

      setCurrentPhase('Limpeza concluída');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na limpeza';
      setError(errorMessage);
      throw err;
    } finally {
      setIsRunning(false);
    }
  };

  const validateDataIntegrity = async (barbershopId: string): Promise<{
    clientsCount: number;
    appointmentsCount: number;
    salesCount: number;
    commandsCount: number;
  }> => {
    try {
      const [clientsData, appointmentsData, salesData, commandsData] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact' }).eq('barbershop_id', barbershopId),
        supabase.from('appointments').select('id', { count: 'exact' }).eq('barbershop_id', barbershopId),
        supabase.from('sales').select('id', { count: 'exact' }).eq('barbershop_id', barbershopId),
        supabase.from('commands').select('id', { count: 'exact' }).eq('barbershop_id', barbershopId),
      ]);

      return {
        clientsCount: clientsData.count || 0,
        appointmentsCount: appointmentsData.count || 0,
        salesCount: salesData.count || 0,
        commandsCount: commandsData.count || 0,
      };
    } catch (err) {
      console.error('Error validating data integrity:', err);
      throw err;
    }
  };

  const getDefaultConfig = (barbershopId: string): HistoricalDataConfig => {
    const currentDate = new Date();
    const sixMonthsAgo = new Date(currentDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const oneMonthAhead = new Date(currentDate);
    oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

    return {
      barbershopId,
      clientsToCreate: 279, // Total will be 300 with existing 21
      appointmentsToCreate: 2000,
      startDate: sixMonthsAgo.toISOString().split('T')[0],
      endDate: oneMonthAhead.toISOString().split('T')[0],
      preserveExisting: true,
    };
  };

  return {
    isRunning,
    currentPhase,
    progress,
    results,
    error,
    generateHistoricalData,
    cleanupHistoricalData,
    validateDataIntegrity,
    getDefaultConfig,
  };
};