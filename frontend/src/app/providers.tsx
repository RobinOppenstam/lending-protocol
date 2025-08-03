// src/app/providers.tsx
'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/config/wagmi';
import { ReactNode, useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';


export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <ThemeProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={{
              lightMode: lightTheme({
                accentColor: '#3b82f6',
                accentColorForeground: 'white',
                borderRadius: 'medium',
              }),
              darkMode: darkTheme({
                accentColor: '#3b82f6',
                accentColorForeground: 'white',
                borderRadius: 'medium',
              }),
            }}
            showRecentTransactions={true}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
