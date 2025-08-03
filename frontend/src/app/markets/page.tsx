// src/app/markets/page.tsx
'use client';

import { Header } from '@/components/Header';
import { MarketsList } from '@/components/MarketsList';
import { markets } from '@/config/contracts';
import { ActionType, Market } from '@/types/defi';
import { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { formatUSD, formatPercentage } from '@/lib/utils';

export default function MarketsPage() {
  const isLoading = false;
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const handleMarketAction = (action: ActionType, market: Market) => {
    setSelectedAction(action);
    setSelectedMarket(market);
  };

  // Calculate total market stats (placeholder data)
  const totalTVL = 1250000; // Placeholder TVL
  const totalBorrowed = 750000; // Placeholder borrowed amount  
  const avgSupplyAPY = 2.8; // Placeholder average supply APY
  const avgBorrowAPY = 6.5; // Placeholder average borrow APY

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lending Markets
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Explore available markets, view real-time interest rates, and manage your lending positions across different assets.
            </p>
          </div>

          {/* Market Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Value Locked</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatUSD(totalTVL)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Borrowed</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatUSD(totalBorrowed)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Supply APY</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatPercentage(avgSupplyAPY)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Borrow APY</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatPercentage(avgBorrowAPY)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Markets List */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Available Markets
            </h2>
            <MarketsList onAction={handleMarketAction} />
          </div>

          {/* Market Details */}
          {selectedMarket && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Market Details: {selectedMarket.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Market Size</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {formatUSD(500000)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Available Liquidity</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {formatUSD(200000)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Utilization Rate</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {formatPercentage(60)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}