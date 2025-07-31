import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageReloadDetector = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);
  const lastLocation = useRef(location.pathname);

  useEffect(() => {
    const isReload = window.performance.navigation.type === 1;
    const isBackForward = window.performance.navigation.type === 2;
    
    if (isReload) {
      console.error('🔄 PÁGINA RECARREGOU COMPLETAMENTE!', {
        currentPath: location.pathname,
        timestamp: new Date().toISOString(),
        navigationType: 'RELOAD'
      });
    }

    if (isBackForward) {
      console.warn('⬅️ Navegação back/forward detectada', {
        currentPath: location.pathname,
        timestamp: new Date().toISOString()
      });
    }

    // Detectar mudanças de rota que causam recarregamento
    if (!isFirstRender.current && location.pathname !== lastLocation.current) {
      console.log('🧭 Mudança de rota detectada:', {
        from: lastLocation.current,
        to: location.pathname,
        timestamp: new Date().toISOString()
      });
    }

    isFirstRender.current = false;
    lastLocation.current = location.pathname;
  }, [location]);

  // Detectar quando a aba volta ao foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Aba voltou ao foco:', {
          currentPath: location.pathname,
          timestamp: new Date().toISOString(),
          wasReloaded: window.performance.navigation.type === 1
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [location]);

  return {
    currentPath: location.pathname
  };
};