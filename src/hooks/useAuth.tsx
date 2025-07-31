import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { globalState, cacheManager } from '@/lib/globalState';

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
  
  // Refs para controle de inicialização e montagem
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (globalState.isEmergencyStopActive()) return null;

    const operationKey = `profile-${userId}`;
    
    // Verificar cache primeiro
    const cached = cacheManager.get<Profile>(operationKey);
    if (cached) return cached;

    if (!await globalState.acquireLock(operationKey)) return null;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      const profile = profileData as Profile;
      cacheManager.set(operationKey, profile, 300000); // 5 min cache
      return profile;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    } finally {
      globalState.releaseLock(operationKey);
    }
  }, []);

  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const operationKey = 'auth-init';
    
    const initializeAuth = async () => {
      if (!await globalState.acquireLock(operationKey)) {
        initializingRef.current = false;
        return;
      }

      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mountedRef.current) return;
            
            setAuthError(null);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              const profileData = await fetchProfile(session.user.id);
              if (mountedRef.current) setProfile(profileData);
            } else {
              if (mountedRef.current) setProfile(null);
            }
            
            if (mountedRef.current) setLoading(false);
          }
        );

        // Check existing session with timeout
        timeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setLoading(false);
            console.warn('useAuth: Session check timeout');
          }
        }, 3000);

        const { data: { session } } = await supabase.auth.getSession();
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (!session && mountedRef.current) {
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mountedRef.current) setLoading(false);
      } finally {
        globalState.releaseLock(operationKey);
      }
    };

    initializeAuth();

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Dependency array empty to run only once

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