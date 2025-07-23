import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

interface SuperAdmin {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

export const useSuperAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if user is super admin
          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .from('super_admins')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              setSuperAdmin(error ? null : data);
            } catch (error) {
              setSuperAdmin(null);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setSuperAdmin(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          try {
            const { data, error } = await supabase
              .from('super_admins')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            setSuperAdmin(error ? null : data);
          } catch (error) {
            setSuperAdmin(null);
          } finally {
            setLoading(false);
          }
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    superAdmin,
    loading,
    signOut,
    isSuperAdmin: !!superAdmin
  };
};