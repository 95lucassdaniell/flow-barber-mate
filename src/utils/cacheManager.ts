// Cache Manager para limpeza agressiva de cache e interceptação global
export class CacheManager {
  private static readonly OLD_PROJECT_ID = 'qtasdgvngwsukvqdzkdn';
  private static readonly CURRENT_PROJECT_ID = 'yzqwmxffjufefocgkevz';
  private static isInterceptionSetup = false;

  static async clearAllCaches(): Promise<void> {
    console.log('🧹 Iniciando limpeza agressiva de cache...');

    try {
      // 1. Limpar localStorage
      this.clearLocalStorage();
      
      // 2. Limpar sessionStorage
      this.clearSessionStorage();
      
      // 3. Limpar Cache API se disponível
      await this.clearCacheAPI();
      
      // 4. Limpar Service Workers antigos
      await this.clearServiceWorkers();
      
      // 5. Limpar IndexedDB se existir
      await this.clearIndexedDB();

      // 6. Instalar Service Worker de interceptação
      await this.installInterceptorServiceWorker();

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
    if (this.isInterceptionSetup) return;
    
    console.log('🔍 Configurando interceptação GLOBAL de chamadas...');
    
    // Circuit Breaker - Para a aplicação se detectar muitas chamadas antigas
    let oldCallCount = 0;
    const MAX_OLD_CALLS = 5;
    
    // Interceptação ULTRA agressiva do XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      const urlString = url.toString();
      
      if (urlString.includes(CacheManager.OLD_PROJECT_ID)) {
        console.error('🚨 CIRCUIT BREAKER: Chamada para projeto antigo BLOQUEADA via XHR:', urlString);
        console.trace('Stack trace completo:');
        
        oldCallCount++;
        if (oldCallCount >= MAX_OLD_CALLS) {
          console.error('🚨 MÁXIMO DE CHAMADAS ANTIGAS ATINGIDO - RESETANDO APLICAÇÃO');
          CacheManager.emergencyReset();
          return;
        }
        
        // Se for cancel-nfe, retornar erro 404 simulado
        if (urlString.includes('cancel-nfe')) {
          console.log('🔄 Simulando resposta 404 para cancel-nfe');
          // Simular uma requisição que falha silenciosamente
          const fakeXHR = new XMLHttpRequest();
          setTimeout(() => {
            if (this.onreadystatechange) {
              Object.defineProperty(this, 'readyState', { value: 4 });
              Object.defineProperty(this, 'status', { value: 404 });
              Object.defineProperty(this, 'responseText', { value: JSON.stringify({ error: 'Function not found' }) });
              this.onreadystatechange.call(this);
            }
          }, 10);
          return;
        }
        
        // Para outras chamadas, redirecionar para projeto correto
        const newUrl = urlString.replace(CacheManager.OLD_PROJECT_ID, CacheManager.CURRENT_PROJECT_ID);
        return originalXHROpen.call(this, method, newUrl, ...args);
      }
      
      return originalXHROpen.call(this, method, url, ...args);
    };

    // Interceptação ULTRA agressiva do fetch
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = input instanceof Request ? input.url : input.toString();
      
      if (url.includes(CacheManager.OLD_PROJECT_ID)) {
        console.error('🚨 CIRCUIT BREAKER: Chamada para projeto antigo BLOQUEADA via fetch:', url);
        console.trace('Stack trace completo:');
        
        oldCallCount++;
        if (oldCallCount >= MAX_OLD_CALLS) {
          console.error('🚨 MÁXIMO DE CHAMADAS ANTIGAS ATINGIDO - RESETANDO APLICAÇÃO');
          CacheManager.emergencyReset();
          return Promise.reject(new Error('Too many old project calls'));
        }
        
        // Se for cancel-nfe, retornar resposta simulada
        if (url.includes('cancel-nfe')) {
          console.log('🔄 Simulando resposta 404 para cancel-nfe');
          return Promise.resolve(new Response(
            JSON.stringify({ error: 'Function not found' }), 
            { status: 404, statusText: 'Not Found' }
          ));
        }
        
        // Para outras chamadas, redirecionar para projeto correto
        const newUrl = url.replace(CacheManager.OLD_PROJECT_ID, CacheManager.CURRENT_PROJECT_ID);
        return originalFetch.call(this, newUrl, init);
      }
      
      return originalFetch.call(this, input, init);
    };
    
    this.isInterceptionSetup = true;
    console.log('✅ Interceptação global configurada com circuit breaker');
  }

  private static async installInterceptorServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Criar e registrar Service Worker dinâmico
        const swCode = `
          const OLD_PROJECT_ID = 'qtasdgvngwsukvqdzkdn';
          const CURRENT_PROJECT_ID = 'yzqwmxffjufefocgkevz';
          
          self.addEventListener('fetch', event => {
            const url = event.request.url;
            
            if (url.includes(OLD_PROJECT_ID)) {
              console.log('🚨 SW: Interceptando chamada para projeto antigo:', url);
              
              if (url.includes('cancel-nfe')) {
                // Retornar resposta simulada para cancel-nfe
                event.respondWith(
                  new Response(JSON.stringify({ error: 'Function not found' }), {
                    status: 404,
                    statusText: 'Not Found',
                    headers: { 'Content-Type': 'application/json' }
                  })
                );
                return;
              }
              
              // Redirecionar outras chamadas
              const newUrl = url.replace(OLD_PROJECT_ID, CURRENT_PROJECT_ID);
              const newRequest = new Request(newUrl, {
                method: event.request.method,
                headers: event.request.headers,
                body: event.request.body,
                mode: event.request.mode,
                credentials: event.request.credentials
              });
              
              event.respondWith(fetch(newRequest));
            }
          });
        `;
        
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        await navigator.serviceWorker.register(swUrl);
        console.log('✅ Service Worker interceptor instalado');
      } catch (error) {
        console.error('❌ Erro ao instalar Service Worker:', error);
      }
    }
  }

  static async emergencyReset(): Promise<void> {
    console.log('🚨 EMERGENCY RESET - Limpando tudo e recarregando...');
    
    // Parar TODAS as operações
    window.stop();
    
    await this.clearAllCaches();
    
    // Forçar reload sem cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Adicionar timestamp único para forçar novo build
    const cacheBuster = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Reload com máxima força
    window.location.href = window.location.protocol + '//' + window.location.host + window.location.pathname + '?emergency_reset=' + cacheBuster;
  }

  static blockAllOldProjectCalls(): void {
    // Sobrescrever métodos ANTES de qualquer inicialização
    const blockCall = (method: string, url: string) => {
      if (url.includes(this.OLD_PROJECT_ID)) {
        console.error(`🚨 BLOCKED ${method} call to old project:`, url);
        if (url.includes('cancel-nfe')) {
          throw new Error('cancel-nfe function blocked - old project call detected');
        }
        throw new Error('Old project call blocked');
      }
    };

    // Interceptar no nível mais baixo possível
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName: string, ...args: any[]) {
      const element = originalCreateElement.apply(this, [tagName, ...args]);
      
      if (tagName.toLowerCase() === 'script') {
        const script = element as HTMLScriptElement;
        const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')?.set;
        
        if (originalSrcSetter) {
          Object.defineProperty(script, 'src', {
            set: function(value: string) {
              if (value.includes(CacheManager.OLD_PROJECT_ID)) {
                console.error('🚨 BLOCKED script load from old project:', value);
                return;
              }
              originalSrcSetter.call(this, value);
            },
            get: function() {
              return this.getAttribute('src') || '';
            }
          });
        }
      }
      
      return element;
    };
  }
}