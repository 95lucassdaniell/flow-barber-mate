import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Configure React Query with aggressive anti-loop settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 0, // No retries to prevent loops
      staleTime: 30 * 60 * 1000, // 30 minutes - very long cache
      gcTime: 60 * 60 * 1000, // 1 hour cache time
      networkMode: 'online',
      refetchInterval: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: 0, // No retries for mutations
    }
  },
})

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
