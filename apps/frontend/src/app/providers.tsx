'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

const ClientQueryProvider = dynamic(() => import('./QueryClientWrapper'), {
  ssr: false,
});

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }
  return <ClientQueryProvider>{children}</ClientQueryProvider>;
}
