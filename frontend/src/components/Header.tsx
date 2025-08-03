// src/components/Header.tsx
'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { truncateAddress } from '@/lib/utils';
import { Bell, Settings, Menu, Home } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const isActivePath = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DL</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DeFi Lending
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sepolia Testnet
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`flex items-center space-x-2 transition-colors font-medium ${
                isActivePath('/') 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link 
              href="/dashboard" 
              className={`transition-colors font-medium ${
                isActivePath('/dashboard') 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/markets" 
              className={`transition-colors font-medium ${
                isActivePath('/markets') 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
              }`}
            >
              Markets
            </Link>
            <Link 
              href="/analytics" 
              className={`transition-colors font-medium ${
                isActivePath('/analytics') 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
              }`}
            >
              Analytics
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* User Info (when connected) */}

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <ThemeToggle />
             
            </div>

            {/* Connect Wallet Button */}
            <ConnectButton />

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700">
            {/* Mobile Theme Toggle */}
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</span>
              <ThemeToggle />
            </div>
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className={`flex items-center space-x-2 transition-colors font-medium px-2 py-1 ${
                  isActivePath('/') 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link 
                href="/dashboard" 
                className={`transition-colors font-medium px-2 py-1 ${
                  isActivePath('/dashboard') 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/markets" 
                className={`transition-colors font-medium px-2 py-1 ${
                  isActivePath('/markets') 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Markets
              </Link>
              <Link 
                href="/analytics" 
                className={`transition-colors font-medium px-2 py-1 ${
                  isActivePath('/analytics') 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Analytics
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}