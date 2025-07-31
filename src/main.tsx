import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Configure React Query to prevent automatic refetching and page reloads
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false, // Disable to prevent reloads on tab focus
      retry: 1, // Reduce retries to prevent hanging
      staleTime: 10 * 60 * 1000, // 10 minutes - longer cache
      gcTime: 15 * 60 * 1000, // 15 minutes cache time
      networkMode: 'online', // Only fetch when online
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
