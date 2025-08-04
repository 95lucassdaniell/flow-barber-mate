// Cache Manager para limpeza agressiva de cache
export class CacheManager {
  private static readonly OLD_PROJECT_ID = 'qtasdgvngwsukvqdzkdn';
  private static readonly CURRENT_PROJECT_ID = 'yzqwmxffjufefocgkevz';

  static async clearAllCaches(): Promise<void> {
    console.log('🧹 Iniciando limpeza agressiva de cache...');

    try {
      // 1. Limpar localStorage
      this.clearLocalStorage();
      
      // 2. Limpar sessionStorage
      this.clearSessionStorage();
      
      // 3. Limpar Cache API se disponível
      await this.clearCacheAPI();
      
      // 4. Limpar Service Workers
      await this.clearServiceWorkers();
      
      // 5. Limpar IndexedDB se existir
      await this.clearIndexedDB();

      console.log('✅ Limpeza de cache concluída');
    } catch (error) {
      console.error('❌ Erro durante limpeza de cache:', error);
    }
  }

  private static clearLocalStorage(): void {
    try {
      // Salvar dados importantes antes da limpeza
      const importantKeys = ['supabase.auth.token', 'user-session'];
      const savedData: Record<string, string> = {};
      
      importantKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value && !value.includes(this.OLD_PROJECT_ID)) {
          savedData[key] = value;
        }
      });

      // Limpar tudo
      localStorage.clear();
      
      // Restaurar dados importantes
      Object.entries(savedData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      console.log('🗑️ localStorage limpo e dados importantes restaurados');
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  }

  private static clearSessionStorage(): void {
    try {
      sessionStorage.clear();
      console.log('🗑️ sessionStorage limpo');
    } catch (error) {
      console.error('Erro ao limpar sessionStorage:', error);
    }
  }

  private static async clearCacheAPI(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('🗑️ Cache API limpo');
      } catch (error) {
        console.error('Erro ao limpar Cache API:', error);
      }
    }
  }

  private static async clearServiceWorkers(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        console.log('🗑️ Service Workers limpos');
      } catch (error) {
        console.error('Erro ao limpar Service Workers:', error);
      }
    }
  }

  private static async clearIndexedDB(): Promise<void> {
    if ('indexedDB' in window) {
      try {
        // Tentar deletar DBs conhecidos
        const dbNames = ['supabase-cache', 'app-cache', 'workbox-precache'];
        
        for (const dbName of dbNames) {
          try {
            const deleteReq = indexedDB.deleteDatabase(dbName);
            await new Promise((resolve, reject) => {
              deleteReq.onsuccess = () => resolve(true);
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          } catch (error) {
            // Ignorar erros de DB que não existem
          }
        }
        
        console.log('🗑️ IndexedDB limpo');
      } catch (error) {
        console.error('Erro ao limpar IndexedDB:', error);
      }
    }
  }

  static detectOldProjectCalls(): void {
    console.log('🔍 Iniciando detecção de chamadas para projeto antigo...');
    
    // Interceptar XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      const urlString = url.toString();
      if (urlString.includes(CacheManager.OLD_PROJECT_ID)) {
        console.error('🚨 BLOCKED: Tentativa de chamada para projeto antigo via XHR:', urlString);
        console.trace('Stack trace da chamada bloqueada:');
        // Substituir pela URL correta
        const newUrl = urlString.replace(CacheManager.OLD_PROJECT_ID, CacheManager.CURRENT_PROJECT_ID);
        return originalXHROpen.call(this, method, newUrl, ...args);
      }
      return originalXHROpen.call(this, method, url, ...args);
    };

    // Interceptar fetch
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = input instanceof Request ? input.url : input.toString();
      if (url.includes(CacheManager.OLD_PROJECT_ID)) {
        console.error('🚨 BLOCKED: Tentativa de chamada para projeto antigo via fetch:', url);
        console.trace('Stack trace da chamada bloqueada:');
        // Substituir pela URL correta
        const newUrl = url.replace(CacheManager.OLD_PROJECT_ID, CacheManager.CURRENT_PROJECT_ID);
        return originalFetch.call(this, newUrl, init);
      }
      return originalFetch.call(this, input, init);
    };
  }

  static async emergencyReset(): Promise<void> {
    console.log('🚨 EMERGENCY RESET - Limpando tudo e recarregando...');
    
    await this.clearAllCaches();
    
    // Forçar reload sem cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Reload com cache forçado
    window.location.href = window.location.href + '?cache_bust=' + Date.now();
  }
}