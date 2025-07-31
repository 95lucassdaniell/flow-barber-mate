import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const useNavigationDebug = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    console.log('🧭 Navigation Debug:', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state,
      navigationType,
      timestamp: new Date().toISOString()
    });

    // Detect if page was reloaded
    if (navigationType === 'POP' && !location.state) {
      console.warn('⚠️ Possible page reload detected');
    }

    // Check for navigation to non-existent routes
    if (location.pathname === '/dashboard') {
      console.error('🚨 Navigation to invalid route /dashboard detected');
    }
  }, [location, navigationType]);

  // Monitor performance to detect full page reloads
  useEffect(() => {
    const navigation = (performance as any).navigation;
    if (navigation) {
      console.log('📊 Navigation timing:', {
        type: navigation.type, // 'navigate', 'reload', 'back_forward'
        redirectCount: navigation.redirectCount,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  return {
    currentPath: location.pathname,
    navigationType,
    isInvalidRoute: location.pathname === '/dashboard'
  };
};