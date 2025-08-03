// src/app/analytics/page.tsx
'use client';

import { Header } from '@/components/Header';
import { markets } from '@/config/contracts';
import { useUserPosition } from '@/hooks/useUserPosition';
import { useAccount } from 'wagmi';
import { BarChart3, TrendingUp, PieChart, Activity, DollarSign, Shield } from 'lucide-react';
import { formatUSD, formatPercentage } from '@/lib/utils';
import Image from 'next/image';

export default function AnalyticsPage() {
  const { isConnected } = useAccount();
  const { userPosition, isLoading: userLoading } = useUserPosition();

  // Calculate protocol analytics (placeholder data for now)
  const totalTVL = 1250000; // Placeholder TVL
  const totalBorrowed = 750000; // Placeholder borrowed amount
  const utilization = totalTVL > 0 ? (totalBorrowed / totalTVL) * 100 : 0;
  const totalUsers = 1247; // This would come from analytics service
  const totalTransactions = 15832; // This would come from analytics service

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Comprehensive insights into protocol performance, market trends, and your portfolio analytics.
            </p>
          </div>

          {/* Protocol Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Value Locked</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatUSD(totalTVL)}
                </p>
                <p className="text-sm text-green-600 mt-1">+12.5% this month</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Borrowed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatUSD(totalBorrowed)}
                </p>
                <p className="text-sm text-green-600 mt-1">+8.3% this month</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-green-600" />
                </div>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Protocol Utilization</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatPercentage(utilization)}
                </p>
                <p className="text-sm text-blue-600 mt-1">Optimal range</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-1">+156 this week</p>
              </div>
            </div>
          </div>

          {/* Market Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Market Composition */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
                Market Composition
              </h3>
              <div className="space-y-4">
                {markets.map((market) => {
                  const marketShare = totalTVL > 0 ? (250000 / totalTVL) * 100 : 0; // Placeholder market size
                  return (
                    <div key={market.symbol} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Image 
                          src={market.icon} 
                          alt={`${market.underlyingSymbol} logo`}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{market.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{market.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatUSD(250000)}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {marketShare.toFixed(1)}% of TVL
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interest Rate Trends */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
                Interest Rate Overview
              </h3>
              <div className="space-y-4">
                {markets.map((market) => (
                  <div key={market.symbol} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Image 
                          src={market.icon} 
                          alt={`${market.underlyingSymbol} logo`}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {market.symbol}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Supply APY</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatPercentage(2.5)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Borrow APY</p>
                        <p className="text-lg font-semibold text-red-600">
                          {formatPercentage(5.2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Analytics (if connected) */}
          {isConnected && userPosition && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
                Your Portfolio Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Portfolio Allocation
                  </p>
                  <div className="space-y-2">
                    {Object.entries(userPosition.positions).map(([market, position]) => {
                      const allocation = userPosition.totalSuppliedUSD > 0 
                        ? (position.suppliedUSD / userPosition.totalSuppliedUSD) * 100 
                        : 0;
                      return (
                        <div key={market} className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">
                            {market === 'lUSDC' ? 'USDC' : 'ETH'}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {allocation.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Risk Metrics
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Health Factor</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {userPosition.healthFactor === Infinity ? '∞' : userPosition.healthFactor.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">LTV Ratio</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {((userPosition.totalBorrowedUSD / userPosition.totalSuppliedUSD) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Borrow Limit Used</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {formatPercentage(userPosition.borrowLimitUsed)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Earnings Summary
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Total Supplied</span>
                      <span className="font-medium text-green-600">
                        {formatUSD(userPosition.totalSuppliedUSD)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Total Borrowed</span>
                      <span className="font-medium text-red-600">
                        {formatUSD(userPosition.totalBorrowedUSD)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Net Position</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {formatUSD(userPosition.totalSuppliedUSD - userPosition.totalBorrowedUSD)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Protocol Statistics */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Protocol Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{totalTransactions.toLocaleString()}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{markets.length}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Markets</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">99.9%</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">$0</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Liquidations (24h)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}