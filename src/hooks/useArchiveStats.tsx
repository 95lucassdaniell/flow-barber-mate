import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ArchiveStats {
  tableName: string;
  activeRecords: number;
  archivedRecords: number;
  totalActiveSize: string;
  totalArchiveSize: string;
  oldestArchiveDate: string | null;
}

interface ArchiveOperation {
  tableName: string;
  recordsArchived: number;
  partitionsDropped: number;
}

export const useArchiveStats = () => {
  const [archiveStats, setArchiveStats] = useState<ArchiveStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchiveStats = async () => {
    try {
      setLoading(true);

      const { data: archiveData } = await supabase
        .rpc('get_archive_stats');

      if (archiveData) {
        setArchiveStats(archiveData.map((stat: any) => ({
          tableName: stat.table_name,
          activeRecords: stat.active_records,
          archivedRecords: stat.archived_records,
          totalActiveSize: stat.total_active_size,
          totalArchiveSize: stat.total_archive_size,
          oldestArchiveDate: stat.oldest_archive_date,
        })));
      }

    } catch (error) {
      console.error('Erro ao buscar estatísticas de arquivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const runArchiveOperation = async (retentionMonths: number = 12): Promise<ArchiveOperation[]> => {
    try {
      const { data: archiveResults } = await supabase
        .rpc('archive_old_data', { retention_months: retentionMonths });

      if (archiveResults) {
        // Refresh stats after archiving
        await fetchArchiveStats();
        
        return archiveResults.map((result: any) => ({
          tableName: result.table_name,
          recordsArchived: result.records_archived,
          partitionsDropped: result.partitions_dropped,
        }));
      }

      return [];
    } catch (error) {
      console.error('Erro ao executar arquivamento:', error);
      throw error;
    }
  };

  const runCleanupOperation = async (yearsToKeep: number = 5): Promise<number> => {
    try {
      const { data: cleanupResult } = await supabase
        .rpc('cleanup_ancient_archives', { years_to_keep: yearsToKeep });

      // Refresh stats after cleanup
      await fetchArchiveStats();
      
      return cleanupResult || 0;
    } catch (error) {
      console.error('Erro ao executar limpeza:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchArchiveStats();
  }, []);

  return {
    archiveStats,
    loading,
    refetch: fetchArchiveStats,
    runArchiveOperation,
    runCleanupOperation
  };
};