import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * PRODUCTION-GRADE QUERY PROVIDER
 * 
 * Based on TanStack React Query best practices:
 * - Proper staleTime for fresh data
 * - Exponential backoff retry
 * - Network mode for offline resilience
 * - Garbage collection for memory management
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // DATA FRESHNESS:
                // staleTime: 0 means data is immediately stale, triggering background refetch
                // This ensures users always see fresh data after navigation
                staleTime: 0,

                // CACHING:
                // gcTime (garbage collection time): how long inactive queries stay in cache
                // 5 minutes is a good balance for production
                gcTime: 1000 * 60 * 5,

                // REFETCH BEHAVIOR:
                // Always refetch when component mounts after navigation
                refetchOnMount: 'always',
                // Refetch when browser tab/window regains focus
                refetchOnWindowFocus: true,
                // Refetch when network reconnects
                refetchOnReconnect: true,

                // RETRY LOGIC:
                // Retry failed requests 3 times with exponential backoff
                retry: 3,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

                // NETWORK MODE:
                // 'always' means queries run even if browser thinks it's offline
                // (important because some browsers falsely report offline status)
                networkMode: 'always',

                // STRUCTURAL SHARING:
                // Enabled by default - prevents unnecessary re-renders
                // by keeping same object references when data hasn't changed
                structuralSharing: true,
            },
            mutations: {
                // Retry mutations once on failure
                retry: 1,
                networkMode: 'always',
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

