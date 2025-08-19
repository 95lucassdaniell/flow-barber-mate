import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { globalState, cacheManager } from '@/lib/globalState';
import { ensureUserProfile } from '@/utils/ensureUserProfile';

interface Profile {
  id: string;
  user_id: string;
  barbershop_id: string;
  role: 'admin' | 'receptionist' | 'barber';
  full_name: string;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const circuitKey = `fetchProfile-${userId}`;
    
    if (globalState.isEmergencyStopActive()) return null;
    if (!globalState.checkCircuitBreaker(circuitKey, 5, 2000)) return null;

    const cacheKey = `profile-${userId}`;
    
    // Verificar cache primeiro
    const cached = cacheManager.get<Profile>(cacheKey);
    if (cached) return cached;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      const profile = profileData as Profile;
      cacheManager.set(cacheKey, profile, 300000); // 5 min cache
      return profile;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const authKey = 'useAuth-init';
    
    // Minimal sync when rate limited to prevent stuck loading states
    const minimalSync = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const profileData = await fetchProfile(session.user.id);
            if (mounted) setProfile(profileData);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Minimal sync error:', error);
        if (mounted) setLoading(false);
      }
    };
    
    // Verificar rate limit para prevenir loops
    if (!globalState.checkRateLimit(authKey, 3, 5000)) {
      console.warn('🚨 Auth rate limit atingido, fazendo sync mínimo');
      minimalSync();
      return;
    }
    
    const initializeAuth = async () => {
      try {
        // Verificação síncrona imediata do localStorage
        const storedSession = localStorage.getItem('sb-yzqwmxffjufefocgkevz-auth-token');

        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (!mounted) return;
            
            setAuthError(null);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              // Fetch profile with rate limit
              const profileKey = `profile-${session.user.id}`;
              if (globalState.checkRateLimit(profileKey, 2, 3000)) {
                setTimeout(async () => {
                  if (mounted) {
                    let profileData = await fetchProfile(session.user.id);
                    
                    // If no profile exists, create one
                    if (!profileData) {
                      profileData = await ensureUserProfile(session.user.id);
                    }
                    
                    if (mounted) {
                      setProfile(profileData as Profile);
                    }
                  }
                }, 100);
              }
            } else {
              if (mounted) setProfile(null);
            }
            
            if (mounted) {
              setLoading(false);
              globalState.clearOperationTimeout('auth-loading');
            }
          }
        );

        // Aggressive session check with immediate retry
        const checkSession = async (attempt = 0): Promise<void> => {
          try {
            console.log(`🔍 Verificando sessão (tentativa ${attempt + 1}/${maxRetries})...`);
            
            // Force session refresh if needed
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Erro ao verificar sessão:', error);
              throw error;
            }
            
            if (session) {
              console.log('✅ Sessão válida encontrada:', session.user.id);
              // Auth state change will handle the rest
            } else {
              console.log('⚠️ Nenhuma sessão ativa');
              // Try to refresh session if we have stored tokens
              if (attempt === 0 && storedSession) {
                console.log('🔄 Tentando refresh da sessão...');
                const { data: refreshData } = await supabase.auth.refreshSession();
                if (refreshData.session) {
                  console.log('✅ Sessão restaurada via refresh');
                  return;
                }
              }
              
              if (mounted) {
                setLoading(false);
                globalState.clearOperationTimeout('auth-loading');
              }
            }
          } catch (error) {
            console.error(`❌ Erro na tentativa ${attempt + 1}:`, error);
            
            if (attempt < maxRetries - 1) {
              // Immediate retry for first few attempts
              const delay = attempt < 2 ? 100 : Math.pow(2, attempt - 2) * 1000;
              console.log(`🔄 Retry em ${delay}ms...`);
              setTimeout(() => checkSession(attempt + 1), delay);
            } else {
              console.error('🚫 Tentativas esgotadas');
              if (mounted) {
                setLoading(false);
                globalState.clearOperationTimeout('auth-loading');
              }
            }
          }
        };

        // Timeout de segurança mais longo
        globalState.setOperationTimeout('auth-loading', () => {
          if (mounted) {
            console.warn('⏰ Auth timeout - forçando loading=false');
            setLoading(false);
          }
        }, 12000);

        // Start session check
        await checkSession();

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('❌ Erro na inicialização auth:', error);
        if (mounted) {
          setLoading(false);
          globalState.clearOperationTimeout('auth-loading');
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      globalState.clearOperationTimeout('auth-loading');
    };
  }, [fetchProfile]);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setAuthError(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthError('Erro ao fazer logout');
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Refresh session error:', error);
        await signOut();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session refresh failed:', error);
      await signOut();
      return false;
    }
  };


  return {
    user,
    session,
    profile,
    loading,
    authError,
    isAdmin: profile?.role === 'admin',
    isReceptionist: profile?.role === 'receptionist',
    isBarber: profile?.role === 'barber',
    canManageAll: profile?.role === 'admin' || profile?.role === 'receptionist',
    signOut,
    refreshSession,
    isAuthenticated: !!user && !!session
  };
};