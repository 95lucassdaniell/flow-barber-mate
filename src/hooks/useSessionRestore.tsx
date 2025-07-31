import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export const useSessionRestore = () => {
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log('🔄 Iniciando restauração de sessão...');
        
        // Check for stored session tokens
        const storedSession = localStorage.getItem('sb-yzqwmxffjufefocgkevz-auth-token');
        if (!storedSession) {
          console.log('❌ Nenhuma sessão armazenada');
          setIsRestoring(false);
          return;
        }

        // Try to get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          // Clear corrupted session data
          await supabase.auth.signOut();
          queryClient.clear();
          setIsRestoring(false);
          return;
        }

        if (session) {
          console.log('✅ Sessão restaurada com sucesso:', session.user.id);
          setSessionRestored(true);
          
          // Invalidate all queries to refetch with restored session
          queryClient.invalidateQueries();
        } else {
          console.log('⚠️ Sessão não encontrada, tentando refresh...');
          
          // Try to refresh session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            console.log('❌ Falha no refresh, limpando dados...');
            await supabase.auth.signOut();
            queryClient.clear();
          } else {
            console.log('✅ Sessão restaurada via refresh');
            setSessionRestored(true);
            queryClient.invalidateQueries();
          }
        }
      } catch (error) {
        console.error('❌ Erro na restauração:', error);
        queryClient.clear();
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, [queryClient]);

  return { isRestoring, sessionRestored };
};