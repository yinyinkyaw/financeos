'use client';

import { HydrationBoundary, QueryClientProvider, type DehydratedState } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { getQueryClient } from '@/lib/get-query-client';
import { tsr } from '@/lib/tsr';

type ProvidersProps = Readonly<{
  children: ReactNode;
  dehydratedState?: DehydratedState;
}>;

export default function Providers({ children, dehydratedState }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <tsr.ReactQueryProvider>{children}</tsr.ReactQueryProvider>
      </HydrationBoundary>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
