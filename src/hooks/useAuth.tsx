import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setAuthError('Erro ao carregar perfil do usuário');
        return null;
      }
      
      return profileData as Profile;
    } catch (error) {
      console.error('Profile fetch error:', error);
      setAuthError('Erro de conexão ao carregar perfil');
      return null;
    }
  };

  const checkSessionValidity = async (session: Session) => {
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    if (expiresAt < now) {
      console.log('Session expired, signing out');
      await supabase.auth.signOut();
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setAuthError(null);
        
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(session);
          setUser(session.user);
          
          // Validate session and fetch profile
          const isValid = await checkSessionValidity(session);
          if (isValid) {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          }
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setAuthError('Erro ao verificar sessão');
          setLoading(false);
          return;
        }
        
        if (session) {
          const isValid = await checkSessionValidity(session);
          if (isValid) {
            setSession(session);
            setUser(session.user);
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    return () => subscription.unsubscribe();
  }, []);

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