// Service Worker para interceptar chamadas para projeto antigo
const OLD_PROJECT_ID = 'qtasdgvngwsukvqdzkdn';
const CURRENT_PROJECT_ID = 'yzqwmxffjufefocgkevz';

console.log('🔄 Service Worker interceptor carregado');

self.addEventListener('install', event => {
  console.log('✅ SW: Instalado com sucesso');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('✅ SW: Ativado com sucesso');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Interceptar TODAS as chamadas para o projeto antigo
  if (url.includes(OLD_PROJECT_ID)) {
    console.log('🚨 SW: Interceptando chamada para projeto antigo:', url);
    
    // Se for cancel-nfe, retornar erro simulado
    if (url.includes('cancel-nfe')) {
      console.log('🔄 SW: Bloqueando cancel-nfe e retornando erro simulado');
      event.respondWith(
        new Response(
          JSON.stringify({ 
            error: 'Function not found - intercepted by SW',
            message: 'cancel-nfe call blocked by service worker',
            timestamp: new Date().toISOString()
          }), 
          {
            status: 404,
            statusText: 'Not Found',
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      );
      return;
    }
    
    // Para outras chamadas, tentar redirecionar para projeto correto
    try {
      const newUrl = url.replace(OLD_PROJECT_ID, CURRENT_PROJECT_ID);
      console.log('🔄 SW: Redirecionando para:', newUrl);
      
      const newRequest = new Request(newUrl, {
        method: event.request.method,
        headers: event.request.headers,
        body: event.request.body,
        mode: event.request.mode,
        credentials: event.request.credentials
      });
      
      event.respondWith(fetch(newRequest));
    } catch (error) {
      console.error('❌ SW: Erro ao redirecionar:', error);
      event.respondWith(
        new Response(
          JSON.stringify({ error: 'Failed to redirect request' }), 
          { status: 500, statusText: 'Internal Server Error' }
        )
      );
    }
  }
  // Para chamadas normais, deixar passar
});

// Monitorar mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'EMERGENCY_RESET') {
    console.log('🚨 SW: Recebido comando de reset de emergência');
    // Limpar todos os caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('✅ SW: Todos os caches limpos');
      // Notificar o cliente
      event.ports[0]?.postMessage({ success: true });
    });
  }
});