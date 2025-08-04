import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { LoadingProvider } from './contexts/LoadingContext'
import { CacheManager } from './utils/cacheManager'

// INTERCEPTAÇÃO NUCLEAR - Bloquear TUDO do projeto antigo IMEDIATAMENTE
console.log('🚨 INICIANDO INTERCEPTAÇÃO NUCLEAR');

// 1. Bloquear no nível mais baixo possível ANTES de qualquer importação
(function nuclearIntercept() {
  const OLD_PROJECT = 'qtasdgvngwsukvqdzkdn';
  const NEW_PROJECT = 'yzqwmxffjufefocgkevz';
  
  // Interceptar fetch IMEDIATAMENTE
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const url = input instanceof Request ? input.url : input.toString();
    if (url.includes(OLD_PROJECT)) {
      console.error('🚨 NUCLEAR BLOCK: fetch call to old project DESTROYED:', url);
      if (url.includes('cancel-nfe')) {
        // Retornar promessa que resolve com erro 404
        return Promise.resolve(new Response('{"error":"Nuclear blocked"}', {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      // Redirecionar outras chamadas
      const newUrl = url.replace(OLD_PROJECT, NEW_PROJECT);
      return originalFetch.call(this, newUrl, init);
    }
    return originalFetch.call(this, input, init);
  };
  
  // Interceptar XMLHttpRequest IMEDIATAMENTE
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    const urlString = url.toString();
    if (urlString.includes(OLD_PROJECT)) {
      console.error('🚨 NUCLEAR BLOCK: XHR call to old project DESTROYED:', urlString);
      if (urlString.includes('cancel-nfe')) {
        // Simular resposta imediata
        setTimeout(() => {
          if (this.onreadystatechange) {
            Object.defineProperty(this, 'readyState', { value: 4 });
            Object.defineProperty(this, 'status', { value: 404 });
            Object.defineProperty(this, 'responseText', { value: '{"error":"Nuclear blocked"}' });
            this.onreadystatechange.call(this);
          }
        }, 1);
        return;
      }
      // Redirecionar outras chamadas
      const newUrl = urlString.replace(OLD_PROJECT, NEW_PROJECT);
      return originalXHROpen.call(this, method, newUrl, ...args);
    }
    return originalXHROpen.call(this, method, url, ...args);
  };
  
  console.log('✅ NUCLEAR INTERCEPT ARMED');
})();

// INTERCEPTAÇÃO ULTRA PRECOCE - Antes de qualquer coisa
CacheManager.blockAllOldProjectCalls();

// Configurar interceptação de chamadas para projeto antigo
CacheManager.detectOldProjectCalls();

// Limpar cache agressivamente na inicialização
CacheManager.clearAllCaches().catch(error => {
  console.error('Erro na limpeza inicial de cache:', error);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          return failureCount < 3;
        }
        return false;
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      networkMode: 'online',
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1,
    }
  },
})

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </QueryClientProvider>
  </BrowserRouter>
);