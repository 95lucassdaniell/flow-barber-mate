import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  notes?: string;
  barbershop_id: string;
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
  validateSession: (sessionId: string) => Promise<boolean>;
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

  // Persist barbershop data in localStorage for mobile
  const persistBarbershopData = (data: { client: Client; barbershop: Barbershop }) => {
    try {
      localStorage.setItem('phoneAuth_client', JSON.stringify(data.client));
      localStorage.setItem('phoneAuth_barbershop', JSON.stringify(data.barbershop));
      console.log('📱 Auth data persisted to localStorage');
    } catch (error) {
      console.warn('Failed to persist auth data:', error);
    }
  };

  const loadPersistedData = () => {
    try {
      const clientData = localStorage.getItem('phoneAuth_client');
      const barbershopData = localStorage.getItem('phoneAuth_barbershop');
      
      if (clientData && barbershopData) {
        const client = JSON.parse(clientData);
        const barbershop = JSON.parse(barbershopData);
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          client,
          barbershop
        }));
        console.log('📱 Loaded persisted auth data:', { clientId: client.id, barbershopId: barbershop.id });
        return true;
      }
    } catch (error) {
      console.warn('Failed to load persisted auth data:', error);
    }
    return false;
  };

  const clearPersistedData = () => {
    try {
      localStorage.removeItem('phoneAuth_client');
      localStorage.removeItem('phoneAuth_barbershop');
      console.log('📱 Cleared persisted auth data');
    } catch (error) {
      console.warn('Failed to clear persisted auth data:', error);
    }
  };

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

      // Persist data for mobile
      persistBarbershopData({ client: data.client, barbershop: data.barbershop });

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

  const validateSession = async (sessionId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      console.log('🔑 Validating session:', sessionId);

      const { data, error } = await supabase.functions.invoke('validate-session', {
        body: { sessionId }
      });

      if (error) {
        console.error('Session validation error:', error);
        throw new Error('Failed to validate session');
      }

      if (!data.valid) {
        console.log('❌ Invalid session:', data.error);
        throw new Error(data.error || 'Invalid session');
      }

      console.log('✅ Session validated successfully');
      
      // Set barbershop data
      setState(prev => ({
        ...prev,
        barbershop: data.barbershop,
        isLoading: false,
        error: null
      }));
      
      // Only set client and authenticate if it's not anonymous
      if (data.client && data.client.phone !== 'anonymous_visitor') {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          client: data.client,
        }));
        
        // Persist data for mobile
        persistBarbershopData(data);
      } else {
        // Anonymous session - barbershop is set but not authenticated yet
        console.log('📝 Anonymous session detected, waiting for phone authentication');
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          client: null,
        }));
      }

      return true;
    } catch (error: any) {
      console.error('Session validation error:', error);
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
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
    clearPersistedData();
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  return (
    <PhoneAuthContext.Provider value={{
      ...state,
      sendVerificationCode,
      verifyCode,
      validateSession,
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