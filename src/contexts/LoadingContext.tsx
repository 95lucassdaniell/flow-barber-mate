import React, { createContext, useContext, useState, useCallback } from 'react';
import { globalState } from '@/lib/globalState';

interface LoadingContextType {
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  hasAnyLoading: () => boolean;
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));

    // Se está começando a carregar, definir timeout de segurança
    if (loading) {
      globalState.setOperationTimeout(`loading-${key}`, () => {
        console.warn(`Loading timeout para ${key} - forçando false`);
        setLoadingStates(prev => ({
          ...prev,
          [key]: false
        }));
      }, 5000);
    } else {
      // Se parou de carregar, limpar timeout
      globalState.clearOperationTimeout(`loading-${key}`);
    }
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const hasAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  const clearAllLoading = useCallback(() => {
    // Limpar todos os timeouts
    Object.keys(loadingStates).forEach(key => {
      globalState.clearOperationTimeout(`loading-${key}`);
    });
    setLoadingStates({});
  }, [loadingStates]);

  return (
    <LoadingContext.Provider value={{
      loadingStates,
      setLoading,
      isLoading,
      hasAnyLoading,
      clearAllLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoadingContext = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};