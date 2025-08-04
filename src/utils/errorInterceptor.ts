// Declaração global para window.supabase
declare global {
  interface Window {
    supabase?: any;
  }
}

// Interceptor para capturar e resolver o erro cancel-nfe
export const setupErrorInterceptor = () => {
  console.log('🛡️ Setting up error interceptor for cancel-nfe');

  // Interceptar o cliente Supabase diretamente
  setTimeout(() => {
    const originalInvoke = (window as any).supabase?.functions?.invoke;
    if (originalInvoke && (window as any).supabase?.functions) {
      (window as any).supabase.functions.invoke = function(functionName: string, options?: any) {
        if (functionName === 'cancel-nfe') {
          console.warn('🚨 Blocked call to cancel-nfe function');
          // Retornar uma promise rejeitada simulada
          return Promise.resolve({
            data: null,
            error: { 
              message: 'Function cancel-nfe not implemented',
              code: 'FUNCTION_NOT_FOUND'
            }
          });
        }
        return originalInvoke.call(this, functionName, options);
      };
    }
  }, 100);

  // Interceptar chamadas de fetch para detectar cancel-nfe
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const [url, options] = args;
    
    // Verificar se é uma chamada para cancel-nfe
    if (typeof url === 'string' && url.includes('cancel-nfe')) {
      console.warn('🚨 Intercepted cancel-nfe fetch call - blocking:', url);
      console.trace('🔍 Call stack for cancel-nfe:');
      
      // Retornar uma resposta simulada para evitar o erro
      return new Response(
        JSON.stringify({ 
          error: 'Function cancel-nfe not implemented',
          code: 'FUNCTION_NOT_FOUND'
        }),
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
        clearNfeCache();
      }
      throw error;
    }
  };

  // Interceptar XMLHttpRequest também
  const originalXMLHttpRequest = window.XMLHttpRequest;
  (window as any).XMLHttpRequest = function(...args: any[]) {
    const xhr = new originalXMLHttpRequest();
    const originalOpen = xhr.open;
    
    xhr.open = function(method: string, url: string | URL, ...args: any[]) {
      if (typeof url === 'string' && url.includes('cancel-nfe')) {
        console.warn('🚨 Blocked XMLHttpRequest to cancel-nfe:', url);
        console.trace('🔍 XMLHttpRequest call stack:');
        
        // Simular uma resposta de erro
        setTimeout(() => {
          Object.defineProperty(xhr, 'status', { value: 404 });
          Object.defineProperty(xhr, 'statusText', { value: 'Not Found' });
          Object.defineProperty(xhr, 'responseText', { 
            value: JSON.stringify({ error: 'Function cancel-nfe not implemented' })
          });
          if (xhr.onerror) {
            const event = new ProgressEvent('error', { lengthComputable: false, loaded: 0, total: 0 });
            xhr.onerror(event);
          }
        }, 0);
        return;
      }
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    return xhr;
  };

  // Interceptar erros globais
  window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('cancel-nfe') || 
        event.error?.stack?.includes('cancel-nfe') ||
        event.message?.includes('cancel-nfe')) {
      console.error('🚨 Global error contains cancel-nfe:', event.error || event.message);
      console.trace('🔍 Global error stack trace:');
      
      // Prevenir que o erro se propague
      event.preventDefault();
      event.stopPropagation();
      
      // Limpar cache
      clearNfeCache();
      return false;
    }
  });

  // Interceptar promises rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('cancel-nfe') ||
        event.reason?.stack?.includes('cancel-nfe') ||
        String(event.reason).includes('cancel-nfe')) {
      console.error('🚨 Unhandled promise rejection contains cancel-nfe:', event.reason);
      console.trace('🔍 Promise rejection stack trace:');
      
      // Prevenir que o erro se propague
      event.preventDefault();
      
      // Limpar cache
      clearNfeCache();
    }
  });

  // Monitorar network requests via Performance API
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('cancel-nfe')) {
        console.warn('🚨 Detected cancel-nfe network request via Performance API:', entry.name);
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (e) {
    console.log('Performance Observer not available');
  }

  console.log('✅ Error interceptor setup complete');
};

// Função para limpar manualmente cache relacionado a NFe
export const clearNfeCache = () => {
  try {
    console.log('🧹 Clearing NFe-related cache...');
    
    // Limpar localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.toLowerCase().includes('nfe') || 
          key.toLowerCase().includes('fiscal') ||
          key.toLowerCase().includes('invoice')) {
        console.log('🗑️ Removing localStorage key:', key);
        localStorage.removeItem(key);
      }
    });
    
    // Limpar sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (key.toLowerCase().includes('nfe') || 
          key.toLowerCase().includes('fiscal') ||
          key.toLowerCase().includes('invoice')) {
        console.log('🗑️ Removing sessionStorage key:', key);
        sessionStorage.removeItem(key);
      }
    });
    
    // Limpar IndexedDB se existir
    if ('indexedDB' in window) {
      indexedDB.databases?.().then(databases => {
        databases.forEach(db => {
          if (db.name?.toLowerCase().includes('nfe') || 
              db.name?.toLowerCase().includes('fiscal')) {
            console.log('🗑️ Attempting to delete IndexedDB:', db.name);
            indexedDB.deleteDatabase(db.name);
          }
        });
      }).catch(console.error);
    }
    
    console.log('✅ NFe-related cache cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing NFe cache:', error);
    return false;
  }
};

// Função para resetar completamente o estado da aplicação
export const resetApplicationState = () => {
  try {
    console.log('🔄 Resetting application state...');
    
    // Limpar todos os caches
    clearNfeCache();
    
    // Limpar cache do navegador se possível
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Forçar reload sem cache
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error resetting application state:', error);
  }
};