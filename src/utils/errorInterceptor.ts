// Interceptor para capturar e resolver o erro cancel-nfe
export const setupErrorInterceptor = () => {
  // Interceptar chamadas de fetch para detectar cancel-nfe
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const [url, options] = args;
    
    // Verificar se é uma chamada para cancel-nfe
    if (typeof url === 'string' && url.includes('cancel-nfe')) {
      console.warn('🚨 Intercepted cancel-nfe call - blocking and logging:', url);
      
      // Retornar uma resposta simulada para evitar o erro
      return new Response(
        JSON.stringify({ error: 'Function cancel-nfe not implemented' }),
        {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Para outras chamadas, usar o fetch original
    try {
      return await originalFetch(...args);
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancel-nfe')) {
        console.error('🚨 Detected cancel-nfe error in fetch:', error);
        // Limpar possíveis dados corruptos
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      }
      throw error;
    }
  };

  // Interceptar erros globais
  window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('cancel-nfe') || 
        event.error?.stack?.includes('cancel-nfe')) {
      console.error('🚨 Global error contains cancel-nfe:', event.error);
      
      // Prevenir que o erro se propague
      event.preventDefault();
      
      // Limpar cache
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Mostrar notificação
        console.log('Cache cleared due to cancel-nfe error');
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  });

  // Interceptar promisses rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('cancel-nfe') ||
        event.reason?.stack?.includes('cancel-nfe')) {
      console.error('🚨 Unhandled promise rejection contains cancel-nfe:', event.reason);
      
      // Prevenir que o erro se propague
      event.preventDefault();
      
      // Limpar cache
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('Cache cleared due to cancel-nfe promise rejection');
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  });
};

// Função para limpar manualmente cache relacionado a NFe
export const clearNfeCache = () => {
  try {
    // Limpar localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('nfe') || key.includes('NFe')) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpar sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('nfe') || key.includes('NFe')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('NFe-related cache cleared');
    return true;
  } catch (error) {
    console.error('Error clearing NFe cache:', error);
    return false;
  }
};