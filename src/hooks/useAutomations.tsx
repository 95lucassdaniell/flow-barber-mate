import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AutomationRule {
  id: string;
  barbershop_id: string;
  type: 'reminder' | 'follow_up' | 'churn_alert' | 'promotion';
  name: string;
  description: string;
  trigger_conditions: {
    days_before_appointment?: number;
    days_after_last_visit?: number;
    churn_risk_level?: 'high' | 'medium' | 'low';
    hour_occupancy_below?: number;
  };
  actions: {
    send_whatsapp?: boolean;
    notify_staff?: boolean;
    create_promotion?: boolean;
  };
  message_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  client_id: string;
  execution_date: string;
  status: 'pending' | 'sent' | 'failed';
  message_content: string;
  error_message?: string;
}

export const useAutomations = () => {
  const { profile } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar regras de automação
  const fetchRules = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('barbershop_id', profile.barbershop_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
      toast.error('Erro ao carregar regras de automação');
    } finally {
      setLoading(false);
    }
  };

  // Carregar execuções recentes
  const fetchExecutions = async () => {
    if (!profile?.barbershop_id) return;

    try {
      const { data, error } = await supabase
        .from('automation_executions')
        .select(`
          *,
          automation_rules!inner(barbershop_id),
          clients(full_name, phone)
        `)
        .eq('automation_rules.barbershop_id', profile.barbershop_id)
        .order('execution_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Erro ao carregar execuções:', error);
    }
  };

  // Criar nova regra
  const createRule = async (ruleData: Omit<AutomationRule, 'id' | 'barbershop_id' | 'created_at' | 'updated_at'>) => {
    if (!profile?.barbershop_id) return;

    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          ...ruleData,
          barbershop_id: profile.barbershop_id
        })
        .select()
        .single();

      if (error) throw error;
      
      setRules(prev => [data, ...prev]);
      toast.success('Regra de automação criada com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao criar regra:', error);
      toast.error('Erro ao criar regra de automação');
      throw error;
    }
  };

  // Atualizar regra
  const updateRule = async (id: string, updates: Partial<AutomationRule>) => {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRules(prev => prev.map(rule => rule.id === id ? data : rule));
      toast.success('Regra atualizada com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar regra:', error);
      toast.error('Erro ao atualizar regra');
      throw error;
    }
  };

  // Deletar regra
  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRules(prev => prev.filter(rule => rule.id !== id));
      toast.success('Regra deletada com sucesso');
    } catch (error) {
      console.error('Erro ao deletar regra:', error);
      toast.error('Erro ao deletar regra');
      throw error;
    }
  };

  // Executar automações manualmente
  const executeAutomations = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('process-automations', {
        body: { barbershopId: profile.barbershop_id }
      });

      if (error) throw error;
      
      toast.success(`${data.executed} automações executadas`);
      fetchExecutions();
    } catch (error) {
      console.error('Erro ao executar automações:', error);
      toast.error('Erro ao executar automações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchRules();
      fetchExecutions();
    }
  }, [profile?.barbershop_id]);

  return {
    rules,
    executions,
    loading,
    createRule,
    updateRule,
    deleteRule,
    executeAutomations,
    refreshRules: fetchRules,
    refreshExecutions: fetchExecutions
  };
};