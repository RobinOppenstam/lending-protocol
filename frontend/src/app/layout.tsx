// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DeFi Lending Protocol',
  description: 'A decentralized lending and borrowing platform built on Ethereum',
  keywords: ['DeFi', 'lending', 'borrowing', 'Ethereum', 'Web3'],
  authors: [{ name: 'Your Name' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background`}>
        
         
          <Providers>
            {children}
          </Providers>
        
      </body>
    </html>
  );
}