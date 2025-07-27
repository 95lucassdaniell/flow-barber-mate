import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LoadTestConfig {
  barbershops: number;
  usersPerBarbershop: number;
  appointmentsPerBarbershop: number;
  salesPerBarbershop: number;
  commandsPerBarbershop: number;
  clientsPerBarbershop: number;
}

interface TestResult {
  phase: string;
  duration: number;
  recordsCreated: number;
  errors: number;
  avgResponseTime: number;
}

interface LoadTestSummary {
  testConfig: LoadTestConfig;
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

export const useLoadTesting = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<LoadTestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runLoadTest = async (config: LoadTestConfig): Promise<LoadTestSummary> => {
    setIsRunning(true);
    setError(null);
    setProgress(0);
    setCurrentPhase('Iniciando teste de carga...');

    try {
      // Call the edge function to generate test data
      const { data, error: invokeError } = await supabase.functions.invoke('load-test-generator', {
        body: { config }
      });

      if (invokeError) throw invokeError;

      setResults(data);
      setProgress(100);
      setCurrentPhase('Teste concluído');
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupTestData = async () => {
    setIsRunning(true);
    setCurrentPhase('Limpando dados de teste...');
    
    try {
      // Delete test barbershops and related data
      const { error: deleteError } = await supabase
        .from('barbershops')
        .delete()
        .like('slug', 'barbershop-test-%');

      if (deleteError) throw deleteError;

      setCurrentPhase('Limpeza concluída');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na limpeza';
      setError(errorMessage);
      throw err;
    } finally {
      setIsRunning(false);
    }
  };

  const validateSystemPerformance = async (): Promise<{
    connectionStats: any;
    memoryStats: any;
    archiveStats: any;
  }> => {
    try {
      // Get current system performance
      const [connectionData, memoryData, archiveData] = await Promise.all([
        supabase.rpc('get_connection_stats'),
        supabase.rpc('get_memory_stats'),
        supabase.rpc('get_archive_stats'),
      ]);

      return {
        connectionStats: connectionData.data?.[0] || null,
        memoryStats: memoryData.data?.[0] || null,
        archiveStats: archiveData.data || [],
      };
    } catch (err) {
      console.error('Error validating system performance:', err);
      throw err;
    }
  };

  return {
    isRunning,
    currentPhase,
    progress,
    results,
    error,
    runLoadTest,
    cleanupTestData,
    validateSystemPerformance,
  };
};