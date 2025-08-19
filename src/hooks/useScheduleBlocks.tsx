
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export interface ScheduleBlock {
  id: string;
  barbershop_id: string;
  provider_id?: string;
  title: string;
  description?: string;
  block_date?: string;
  start_time: string;
  end_time: string;
  is_full_day: boolean;
  recurrence_type: 'none' | 'weekly';
  days_of_week?: number[];
  start_date?: string;
  end_date?: string;
  status: 'active' | 'inactive';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleBlockInput {
  provider_id?: string;
  title: string;
  description?: string;
  block_date?: string;
  start_time: string;
  end_time: string;
  is_full_day: boolean;
  recurrence_type: 'none' | 'weekly';
  days_of_week?: number[];
  start_date?: string;
  end_date?: string;
}

export const useScheduleBlocks = (barbershopId?: string) => {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBlocks = useCallback(async () => {
    if (!barbershopId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure recurrence_type matches our interface
      const typedBlocks = (data || []).map(block => ({
        ...block,
        recurrence_type: block.recurrence_type as 'none' | 'weekly'
      })) as ScheduleBlock[];
      
      setBlocks(typedBlocks);
    } catch (error) {
      console.error('Error fetching schedule blocks:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar bloqueios de agenda',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [barbershopId, toast]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const createBlock = async (blockData: ScheduleBlockInput) => {
    if (!barbershopId) return false;

    try {
      const { error } = await supabase
        .from('schedule_blocks')
        .insert({
          ...blockData,
          barbershop_id: barbershopId,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Bloqueio criado com sucesso',
      });

      await fetchBlocks();
      return true;
    } catch (error) {
      console.error('Error creating schedule block:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar bloqueio',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateBlock = async (blockId: string, blockData: Partial<ScheduleBlockInput>) => {
    try {
      const { error } = await supabase
        .from('schedule_blocks')
        .update(blockData)
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Bloqueio atualizado com sucesso',
      });

      await fetchBlocks();
      return true;
    } catch (error) {
      console.error('Error updating schedule block:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar bloqueio',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('schedule_blocks')
        .update({ status: 'inactive' })
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Bloqueio removido com sucesso',
      });

      await fetchBlocks();
      return true;
    } catch (error) {
      console.error('Error deleting schedule block:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover bloqueio',
        variant: 'destructive',
      });
      return false;
    }
  };

  const isTimeBlocked = useCallback((
    date: Date,
    timeSlot: string,
    providerId?: string
  ): ScheduleBlock | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();

    for (const block of blocks) {
      // Verificar se o bloco se aplica ao barbeiro específico
      if (block.provider_id && providerId && block.provider_id !== providerId) {
        continue;
      }

      // Bloqueio pontual por data
      if (block.recurrence_type === 'none' && block.block_date === dateStr) {
        if (block.is_full_day || 
            (timeSlot >= block.start_time && timeSlot < block.end_time)) {
          return block;
        }
      }

      // Bloqueio recorrente semanal
      if (block.recurrence_type === 'weekly' && 
          block.days_of_week?.includes(dayOfWeek)) {
        
        // Verificar se está dentro da janela de recorrência
        const isInWindow = (!block.start_date || dateStr >= block.start_date) &&
                          (!block.end_date || dateStr <= block.end_date);
        
        if (isInWindow && 
            (block.is_full_day || 
             (timeSlot >= block.start_time && timeSlot < block.end_time))) {
          return block;
        }
      }
    }

    return null;
  }, [blocks]);

  return {
    blocks,
    loading,
    createBlock,
    updateBlock,
    deleteBlock,
    isTimeBlocked,
    refetch: fetchBlocks,
  };
};
