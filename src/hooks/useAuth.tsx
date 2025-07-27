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
    console.log('useAuth: Starting initialization');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setAuthError(null);
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('useAuth: User signed out or no session');
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          console.log('useAuth: Token refreshed or signed in');
          setSession(session);
          setUser(session.user);
          
          // Fetch profile after setting user - don't block on this
          setTimeout(async () => {
            try {
              const isValid = await checkSessionValidity(session);
              if (isValid) {
                const profileData = await fetchProfile(session.user.id);
                setProfile(profileData);
              }
            } catch (error) {
              console.error('Profile fetch error in state change:', error);
            }
          }, 0);
          
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('useAuth: Checking for existing session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setAuthError('Erro ao verificar sessão');
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        if (session) {
          console.log('useAuth: Found existing session');
          const isValid = await checkSessionValidity(session);
          if (isValid) {
            setSession(session);
            setUser(session.user);
            
            // Validate that auth.uid() works before fetching profile
            const authValid = await validateAuthConnection();
            if (!authValid) {
              console.warn('useAuth: auth.uid() not working, forcing logout');
              await forceLogout('auth.uid() validation failed');
              return;
            }
            
            // Fetch profile but don't block initialization
            try {
              const profileData = await fetchProfile(session.user.id);
              setProfile(profileData);
            } catch (error) {
              console.error('Profile fetch error during init:', error);
              setProfile(null);
            }
          } else {
            console.log('useAuth: Session invalid');
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } else {
          console.log('useAuth: No existing session found');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError('Erro de conexão');
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        console.log('useAuth: Initialization complete');
        setLoading(false);
      }
    };

    initializeAuth();
    
    // Add timeout as safety net
    const timeoutId = setTimeout(() => {
      console.warn('useAuth: Timeout reached, forcing loading to false');
      setLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
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

  // Validate if auth.uid() works with current session
  const validateAuthConnection = async (): Promise<boolean> => {
    try {
      console.log('useAuth: Validating auth connection...');
      const { data, error } = await supabase.rpc('get_user_barbershop_id');
      
      if (error) {
        console.error('Auth validation failed:', error);
        return false;
      }
      
      console.log('useAuth: Auth validation successful, barbershop_id:', data);
      return true;
    } catch (error) {
      console.error('Auth validation error:', error);
      return false;
    }
  };

  // Force logout when session is invalid
  const forceLogout = async (reason: string) => {
    console.warn('useAuth: Forcing logout -', reason);
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
    await supabase.auth.signOut();
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
    validateAuthConnection,
    forceLogout,
    isAuthenticated: !!user && !!session
  };
};