import { useState, useEffect, useCallback } from 'react';
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

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (globalState.isEmergencyStopActive()) return null;

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
    
    // Timeout de segurança para loading
    globalState.setOperationTimeout('auth-loading', () => {
      if (mounted) {
        setLoading(false);
        console.warn('useAuth: Loading timeout - forçando false');
      }
    }, 3000);

    const initializeAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            setAuthError(null);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              const profileData = await fetchProfile(session.user.id);
              if (mounted) setProfile(profileData);
            } else {
              if (mounted) setProfile(null);
            }
            
            if (mounted) {
              setLoading(false);
              globalState.clearOperationTimeout('auth-loading');
            }
          }
        );

        // Check existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && mounted) {
          setLoading(false);
          globalState.clearOperationTimeout('auth-loading');
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
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