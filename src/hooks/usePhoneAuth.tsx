import { useState, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  notes?: string;
}

interface Barbershop {
  id: string;
  name: string;
  slug: string;
}

interface PhoneAuthState {
  isAuthenticated: boolean;
  phone: string | null;
  client: Client | null;
  barbershop: Barbershop | null;
  isLoading: boolean;
  error: string | null;
}

interface PhoneAuthContextType extends PhoneAuthState {
  sendVerificationCode: (phone: string, barbershopSlug: string) => Promise<boolean>;
  verifyCode: (phone: string, code: string, barbershopSlug: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const PhoneAuthContext = createContext<PhoneAuthContextType | undefined>(undefined);

export const PhoneAuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PhoneAuthState>({
    isAuthenticated: false,
    phone: null,
    client: null,
    barbershop: null,
    isLoading: false,
    error: null,
  });

  const sendVerificationCode = async (phone: string, barbershopSlug: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { phone, barbershopSlug }
      });

      if (error) throw error;

      if (!data.success) {
        setState(prev => ({ ...prev, error: data.error, isLoading: false }));
        return false;
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Erro ao enviar código de verificação', 
        isLoading: false 
      }));
      return false;
    }
  };

  const verifyCode = async (phone: string, code: string, barbershopSlug: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-phone-code', {
        body: { phone, code, barbershopSlug }
      });

      if (error) throw error;

      if (!data.success) {
        setState(prev => ({ ...prev, error: data.error, isLoading: false }));
        return false;
      }

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        phone,
        client: data.client,
        barbershop: data.barbershop,
        isLoading: false,
        error: null
      }));

      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Erro ao verificar código', 
        isLoading: false 
      }));
      return false;
    }
  };

  const logout = () => {
    setState({
      isAuthenticated: false,
      phone: null,
      client: null,
      barbershop: null,
      isLoading: false,
      error: null,
    });
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <PhoneAuthContext.Provider value={{
      ...state,
      sendVerificationCode,
      verifyCode,
      logout,
      clearError,
    }}>
      {children}
    </PhoneAuthContext.Provider>
  );
};

export const usePhoneAuth = () => {
  const context = useContext(PhoneAuthContext);
  if (context === undefined) {
    throw new Error('usePhoneAuth must be used within a PhoneAuthProvider');
  }
  return context;
};