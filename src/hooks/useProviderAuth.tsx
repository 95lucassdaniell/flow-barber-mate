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
  temporary_password?: string;
  password_expires_at?: string;
  must_change_password?: boolean;
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
          temporary_password,
          password_expires_at,
          must_change_password,
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

  const providerLogin = async (email: string, temporaryPassword: string) => {
    try {
      // Primeiro, verificar se existe um prestador com essa senha temporária
      const { data: providerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('temporary_password', temporaryPassword)
        .eq('role', 'barber')
        .eq('is_active', true)
        .single();

      if (profileError || !providerProfile) {
        throw new Error('Credenciais inválidas ou senha temporária expirada');
      }

      // Verificar se a senha não expirou
      if (providerProfile.password_expires_at && new Date(providerProfile.password_expires_at) < new Date()) {
        throw new Error('Senha temporária expirada. Entre em contato com o administrador.');
      }

      // Fazer login com Supabase Auth usando email e senha temporária
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: temporaryPassword
      });

      if (authError) {
        throw authError;
      }

      // Atualizar last_login_at
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', providerProfile.id);

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

      // Limpar senha temporária e marcar como não precisando trocar senha
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          temporary_password: null,
          password_expires_at: null,
          must_change_password: false
        })
        .eq('user_id', user.id);

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
    mustChangePassword: profile?.must_change_password ?? false,
    providerLogin,
    changePassword,
    signOut
  };
};