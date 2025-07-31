import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { LoadingProvider } from './contexts/LoadingContext'

// Configure React Query with session-aware settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Enable mount refetch for fresh data after refresh
      refetchOnReconnect: true, // Enable reconnect refetch
      retry: (failureCount, error: any) => {
        // Retry on auth errors up to 3 times
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          return failureCount < 3;
        }
        return false;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes - shorter for auth-dependent data
      gcTime: 30 * 60 * 1000, // 30 minutes cache time
      networkMode: 'online',
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 1, // Single retry for mutations
    }
  },
})

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <LoadingProvider>
      <App />
    </LoadingProvider>
  </QueryClientProvider>
);
