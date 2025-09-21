"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
          retry: (failureCount, error: Error & { status?: number }) => {
            // Don't retry on 4xx errors (client errors)
            if (error?.status && error.status >= 400 && error.status < 500) {
              return false;
            }
            // Retry up to 3 times for other errors
            return failureCount < 3;
          },
          refetchOnWindowFocus: false, // Disable refetch on window focus for better UX
          refetchOnReconnect: true, // Refetch when connection is restored
        },
        mutations: {
          retry: false, // Don't retry mutations by default
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}