'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a single QueryClient instance that persists across renders
  // Using useState with initializer function (lazy initialization)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        // Prevent racing queries from causing unnecessary re-renders
        retry: 1,
      },
      mutations: {
        // Ensure mutations don't cause excessive re-renders
        retry: 0,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
