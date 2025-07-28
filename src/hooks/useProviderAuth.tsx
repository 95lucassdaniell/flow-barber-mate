import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';

interface ProviderProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  barbershop_id: string;
  last_login_at?: string;
  is_active: boolean;
}

export const useProviderAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProvider, setIsProvider] = useState(false);

  const fetchProfile = async (userId: string): Promise<ProviderProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          role,
          barbershop_id,
          last_login_at,
          is_active
        `)
        .eq('user_id', userId)
        .eq('role', 'barber')
        .single();

      if (error) {
        console.error('Error fetching provider profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            const providerProfile = await fetchProfile(session.user.id);
            setProfile(providerProfile);
            setIsProvider(!!providerProfile);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsProvider(false);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(providerProfile => {
          setProfile(providerProfile);
          setIsProvider(!!providerProfile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const providerLogin = async (email: string, password: string) => {
    try {
      console.log('🔍 Tentando login para:', email);
      
      // Verificar se o prestador existe e está ativo
      const { data: providerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('role', 'barber')
        .eq('is_active', true)
        .maybeSingle();

      console.log('📋 Profile encontrado:', providerProfile);
      console.log('❌ Profile error:', profileError);

      if (profileError || !providerProfile) {
        console.log('❌ Prestador não encontrado ou erro de profile');
        throw new Error('Credenciais inválidas ou prestador não encontrado');
      }

      console.log('🔐 Tentando autenticação com Supabase...');
      // Fazer login com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('✅ Auth data:', authData);
      console.log('❌ Auth error:', authError);

      if (authError) {
        console.log('❌ Erro de autenticação:', authError.message);
        throw authError;
      }

      console.log('🔄 Atualizando last_login_at...');
      // Atualizar last_login_at
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', providerProfile.id);

      console.log('✅ Login realizado com sucesso!');
      return { data: authData, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      // Atualizar senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // Nenhuma atualização no perfil necessária
      const profileError = null;

      if (profileError) throw profileError;

      // Refetch profile
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsProvider(false);
  };

  return {
    user,
    session,
    profile,
    loading,
    isProvider,
    isAuthenticated: !!user && !!profile,
    providerLogin,
    changePassword,
    signOut
  };
};