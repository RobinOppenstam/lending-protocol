// src/components/MarketsList.tsx
'use client';

import { useMarketData } from '@/hooks/useMarketData';
import { markets } from '@/config/contracts';
import { ActionType, Market, MarketData } from '@/types/defi';
import { formatNumber, formatPercentage, formatUSD } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface MarketsListProps {
  onAction: (action: ActionType, market: Market) => void;
}

export function MarketsList({ onAction }: MarketsListProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'supply' | 'borrow'>('overview');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl card-shadow">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Markets
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Supply assets to earn interest or borrow against your collateral
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            {(['overview', 'supply', 'borrow'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === tab
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Markets Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Supply
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Supply APY
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Borrow
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Borrow APY
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Liquidity
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {markets.map((market) => (
              <MarketRow 
                key={market.symbol} 
                market={market} 
                onAction={onAction}
                selectedTab={selectedTab}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Market Summary */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {markets.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Markets Available
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              0-15%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Supply APY Range
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              75-80%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Max Collateral Factor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MarketRowProps {
  market: Market;
  onAction: (action: ActionType, market: Market) => void;
  selectedTab: 'overview' | 'supply' | 'borrow';
}

function MarketRow({ market, onAction, selectedTab }: MarketRowProps) {
  const { marketData, isLoading } = useMarketData(market.lTokenAddress);
  const [isHovered, setIsHovered] = useState(false);

  if (isLoading) {
    return <MarketRowSkeleton />;
  }

  if (!marketData) {
    return <MarketRowError market={market} />;
  }

  return (
    <tr 
      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Asset */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <Image 
            src={market.icon} 
            alt={`${market.underlyingSymbol} logo`}
            width={32}
            height={32}
            className="rounded-full"
          />
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {market.name}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {market.underlyingSymbol}
            </div>
          </div>
          <div className="hidden sm:block">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              market.collateralFactor >= 0.8 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
              {formatPercentage(market.collateralFactor * 100)} LTV
            </span>
          </div>
        </div>
      </td>

      {/* Total Supply */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {formatNumber(marketData.liquidity, { compact: true })}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {market.underlyingSymbol}
        </div>
      </td>

      {/* Supply APY */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-green-600">
            {formatPercentage(marketData.supplyAPY)}
          </span>
          <TrendingUp className="w-3 h-3 text-green-500" />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Earn interest
        </div>
      </td>

      {/* Total Borrow */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {formatNumber(Number(marketData.totalBorrows) / (10 ** market.decimals), { compact: true })}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {formatPercentage(marketData.utilizationRate)} utilized
        </div>
      </td>

      {/* Borrow APY */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-red-600">
            {formatPercentage(marketData.borrowAPY)}
          </span>
          <TrendingDown className="w-3 h-3 text-red-500" />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Interest rate
        </div>
      </td>

      {/* Liquidity */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {formatUSD(marketData.liquidity * marketData.price)}
        </div>
        <div className="flex items-center space-x-1">
          <Activity className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Available
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end space-x-2">
          {selectedTab === 'overview' && (
            <>
              <button
                onClick={() => onAction('supply', market)}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >
                Supply
              </button>
              <button
                onClick={() => onAction('borrow', market)}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                Borrow
              </button>
            </>
          )}
          
          {selectedTab === 'supply' && (
            <button
              onClick={() => onAction('supply', market)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <span>Supply</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          
          {selectedTab === 'borrow' && (
            <button
              onClick={() => onAction('borrow', market)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span>Borrow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// Loading skeleton for market row
function MarketRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full loading-skeleton" />
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded loading-skeleton" />
            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded loading-skeleton" />
          </div>
        </div>
      </td>
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded loading-skeleton" />
            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded loading-skeleton" />
          </div>
        </td>
      ))}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex justify-end space-x-2">
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded loading-skeleton" />
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded loading-skeleton" />
        </div>
      </td>
    </tr>
  );
}

// Error state for market row
function MarketRowError({ market }: { market: Market }) {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <Image 
            src={market.icon} 
            alt={`${market.underlyingSymbol} logo`}
            width={32}
            height={32}
            className="rounded-full"
          />
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {market.name}
            </div>
            <div className="text-sm text-red-500">
              Failed to load data
            </div>
          </div>
        </div>
      </td>
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            —
          </div>
        </td>
      ))}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button 
          disabled
          className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-not-allowed"
        >
          Unavailable
        </button>
      </td>
    </tr>
  );
}