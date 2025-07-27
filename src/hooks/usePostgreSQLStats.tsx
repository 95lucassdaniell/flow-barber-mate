import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  idleInTransaction: number;
  maxConnections: number;
  connectionUsagePercent: number;
}

interface MemoryStats {
  sharedBuffersSize: string;
  effectiveCacheSize: string;
  workMem: string;
  maintenanceWorkMem: string;
  bufferHitRatio: number;
  indexHitRatio: number;
  tableHitRatio: number;
  tempFilesCount: number;
  tempBytes: number;
}

interface SlowQuery {
  queryText: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  maxTime: number;
  stddevTime: number;
  rowsAffected: number;
}

interface LockStat {
  lockType: string;
  databaseName: string;
  relationName: string;
  modeLock: string;
  granted: boolean;
  waitingDuration: string;
  queryText: string;
}

interface OptimizationRecommendation {
  category: string;
  recommendation: string;
  currentValue: string;
  recommendedValue: string;
  priority: string;
  description: string;
}

interface VacuumStat {
  schemaName: string;
  tableName: string;
  lastVacuum: string;
  lastAutovacuum: string;
  lastAnalyze: string;
  lastAutoanalyze: string;
  vacuumCount: number;
  autovacuumCount: number;
  analyzeCount: number;
  autoanalyzeCount: number;
  nDeadTup: number;
  nLiveTup: number;
  deadTuplePercent: number;
}

export const usePostgreSQLStats = () => {
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [lockStats, setLockStats] = useState<LockStat[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [vacuumStats, setVacuumStats] = useState<VacuumStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnectionStats = async () => {
    try {
      const { data } = await supabase.rpc('get_connection_stats');
      if (data && data.length > 0) {
        const stats = data[0];
        setConnectionStats({
          totalConnections: stats.total_connections,
          activeConnections: stats.active_connections,
          idleConnections: stats.idle_connections,
          idleInTransaction: stats.idle_in_transaction,
          maxConnections: stats.max_connections,
          connectionUsagePercent: stats.connection_usage_percent,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de conexão:', error);
    }
  };

  const fetchMemoryStats = async () => {
    try {
      const { data } = await supabase.rpc('get_memory_stats');
      if (data && data.length > 0) {
        const stats = data[0];
        setMemoryStats({
          sharedBuffersSize: stats.shared_buffers_size,
          effectiveCacheSize: stats.effective_cache_size,
          workMem: stats.work_mem,
          maintenanceWorkMem: stats.maintenance_work_mem,
          bufferHitRatio: stats.buffer_hit_ratio,
          indexHitRatio: stats.index_hit_ratio,
          tableHitRatio: stats.table_hit_ratio,
          tempFilesCount: stats.temp_files_count,
          tempBytes: stats.temp_bytes,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de memória:', error);
    }
  };

  const fetchSlowQueries = async () => {
    try {
      const { data } = await supabase.rpc('get_slow_queries');
      if (data) {
        setSlowQueries(data.map((query: any) => ({
          queryText: query.query_text,
          calls: query.calls,
          totalTime: query.total_time,
          meanTime: query.mean_time,
          maxTime: query.max_time,
          stddevTime: query.stddev_time,
          rowsAffected: query.rows_affected,
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar queries lentas:', error);
    }
  };

  const fetchLockStats = async () => {
    try {
      const { data } = await supabase.rpc('get_lock_stats');
      if (data) {
        setLockStats(data.map((lock: any) => ({
          lockType: lock.lock_type,
          databaseName: lock.database_name,
          relationName: lock.relation_name,
          modeLock: lock.mode_lock,
          granted: lock.granted,
          waitingDuration: lock.waiting_duration,
          queryText: lock.query_text,
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de locks:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const { data } = await supabase.rpc('get_optimization_recommendations');
      if (data) {
        setRecommendations(data.map((rec: any) => ({
          category: rec.category,
          recommendation: rec.recommendation,
          currentValue: rec.current_value,
          recommendedValue: rec.recommended_value,
          priority: rec.priority,
          description: rec.description,
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
    }
  };

  const fetchVacuumStats = async () => {
    try {
      const { data } = await supabase.rpc('get_vacuum_stats');
      if (data) {
        setVacuumStats(data.map((vacuum: any) => ({
          schemaName: vacuum.schema_name,
          tableName: vacuum.table_name,
          lastVacuum: vacuum.last_vacuum,
          lastAutovacuum: vacuum.last_autovacuum,
          lastAnalyze: vacuum.last_analyze,
          lastAutoanalyze: vacuum.last_autoanalyze,
          vacuumCount: vacuum.vacuum_count,
          autovacuumCount: vacuum.autovacuum_count,
          analyzeCount: vacuum.analyze_count,
          autoanalyzeCount: vacuum.autoanalyze_count,
          nDeadTup: vacuum.n_dead_tup,
          nLiveTup: vacuum.n_live_tup,
          deadTuplePercent: vacuum.dead_tuple_percent,
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de vacuum:', error);
    }
  };

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchConnectionStats(),
        fetchMemoryStats(),
        fetchSlowQueries(),
        fetchLockStats(),
        fetchRecommendations(),
        fetchVacuumStats(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, []);

  return {
    connectionStats,
    memoryStats,
    slowQueries,
    lockStats,
    recommendations,
    vacuumStats,
    loading,
    refetch: fetchAllStats,
  };
};