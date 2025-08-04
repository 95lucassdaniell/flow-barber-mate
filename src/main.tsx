import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { LoadingProvider } from './contexts/LoadingContext'
import { setupErrorInterceptor, clearNfeCache } from './utils/errorInterceptor'

// Configurar interceptor de erro ao inicializar
setupErrorInterceptor();

// Limpar cache de NFe ao inicializar
clearNfeCache();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('cancel-nfe')) {
          console.error('🚨 React Query detected cancel-nfe error, blocking retry:', error);
          clearNfeCache();
          return false;
        }
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