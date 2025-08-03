// src/components/UserOverview.tsx
'use client';

import { UserPosition } from '@/types/defi';
import { formatUSD, formatPercentage, getRiskLevel } from '@/lib/utils';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, DollarSign, PiggyBank, RefreshCw } from 'lucide-react';
import Image from 'next/image';

interface UserOverviewProps {
  userPosition?: UserPosition;
  isLoading: boolean;
  onRefresh?: () => void;
}

export function UserOverview({ userPosition, isLoading, onRefresh }: UserOverviewProps) {
  // Debug logging
  console.log('UserOverview render:', { userPosition, isLoading });
  
  if (isLoading) {
    return <UserOverviewSkeleton />;
  }

  if (!userPosition) {
    return <EmptyUserOverview />;
  }

  const riskLevel = getRiskLevel(userPosition.healthFactor);
  const isAtRisk = userPosition.borrowLimitUsed > 80;
  
  // Calculate LTV (Loan-to-Value ratio)
  const ltv = userPosition.totalSuppliedUSD > 0 
    ? (userPosition.totalBorrowedUSD / userPosition.totalSuppliedUSD) * 100 
    : 0;
  
  // Calculate available borrow power
  const availableBorrow = Math.max(0, userPosition.borrowLimitUSD - userPosition.totalBorrowedUSD);
  
  // Get asset breakdown
  const assetBreakdown = Object.entries(userPosition.positions).map(([market, position]) => ({
    market,
    position,
    name: market === 'lUSDC' ? 'USD Coin' : 'Ethereum',
    symbol: market === 'lUSDC' ? 'USDC' : 'WETH',
    icon: market === 'lUSDC' ? '/usdc_logo.png' : '/Eth_logo.png',
    collateralFactor: market === 'lUSDC' ? 0.8 : 0.75
  }));

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Your Portfolio
        </h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Portfolio Value */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Portfolio Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatUSD(userPosition.totalSuppliedUSD)}
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Net worth in protocol
          </div>
        </div>

        {/* LTV Ratio */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              ltv > 75 ? 'bg-red-100 dark:bg-red-900/20' :
              ltv > 60 ? 'bg-yellow-100 dark:bg-yellow-900/20' :
              'bg-green-100 dark:bg-green-900/20'
            }`}>
              <TrendingUp className={`w-5 h-5 ${
                ltv > 75 ? 'text-red-600' :
                ltv > 60 ? 'text-yellow-600' :
                'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">LTV Ratio</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {ltv.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Borrowed / Supplied
          </div>
        </div>
        {/* Available to Borrow */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Available to Borrow</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatUSD(availableBorrow)}
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Remaining borrow capacity
          </div>
        </div>

        {/* Health Factor */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                riskLevel.level === 'safe' 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : riskLevel.level === 'critical'
                  ? 'bg-red-100 dark:bg-red-900/20'
                  : 'bg-yellow-100 dark:bg-yellow-900/20'
              }`}>
                <Shield className={`w-5 h-5 ${
                  riskLevel.level === 'safe' 
                    ? 'text-green-600' 
                    : riskLevel.level === 'critical'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Health Factor</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {userPosition.healthFactor === Infinity ? '∞' : userPosition.healthFactor.toFixed(2)}
                </p>
              </div>
            </div>
            {riskLevel.level !== 'safe' && (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <div className={`text-sm font-medium ${riskLevel.color}`}>
            {riskLevel.label}
          </div>
        </div>
      </div>

      {/* Borrow Limit Progress */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Borrow Limit
            </h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {formatUSD(userPosition.totalBorrowedUSD)} / {formatUSD(userPosition.borrowLimitUSD)}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  userPosition.borrowLimitUsed > 90 
                    ? 'bg-red-500' 
                    : userPosition.borrowLimitUsed > 80 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(userPosition.borrowLimitUsed, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                {formatPercentage(userPosition.borrowLimitUsed)} used
              </span>
              <span className={`font-medium ${
                userPosition.borrowLimitUsed > 80 ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {formatUSD(userPosition.borrowLimitUSD - userPosition.totalBorrowedUSD)} available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      {isAtRisk && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                High Utilization Warning
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You're using {formatPercentage(userPosition.borrowLimitUsed)} of your borrow limit. 
                Consider supplying more collateral or repaying debt to reduce liquidation risk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Asset Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply Positions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Supply Positions
            </h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Total: {formatUSD(userPosition.totalSuppliedUSD)}
            </div>
          </div>
          <div className="space-y-4">
            {assetBreakdown.filter(asset => asset.position.suppliedUSD > 0).map((asset) => (
              <div key={asset.market} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Image 
                      src={asset.icon} 
                      alt={`${asset.symbol} logo`}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{asset.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{asset.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatUSD(asset.position.suppliedUSD)}
                    </p>
                    <p className="text-sm text-green-600">
                      +{asset.position.apy.supply.toFixed(2)}% APY
                    </p>
                  </div>
                </div>
                {/* Collateral Info */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Collateral Factor: {(asset.collateralFactor * 100).toFixed(0)}%
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Borrow Power: {formatUSD(asset.position.suppliedUSD * asset.collateralFactor)}
                  </span>
                </div>
              </div>
            ))}
            {assetBreakdown.filter(asset => asset.position.suppliedUSD > 0).length === 0 && (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                No supply positions yet
              </div>
            )}
          </div>
        </div>

        {/* Borrow Positions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Borrow Positions
            </h3>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Total: {formatUSD(userPosition.totalBorrowedUSD)}
            </div>
          </div>
          <div className="space-y-4">
            {assetBreakdown.filter(asset => asset.position.borrowedUSD > 0).map((asset) => (
              <div key={asset.market} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Image 
                      src={asset.icon} 
                      alt={`${asset.symbol} logo`}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{asset.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{asset.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatUSD(asset.position.borrowedUSD)}
                    </p>
                    <p className="text-sm text-red-600">
                      -{asset.position.apy.borrow.toFixed(2)}% APY
                    </p>
                  </div>
                </div>
                {/* Interest Accruing */}
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Interest accruing at current rate
                </div>
              </div>
            ))}
            {assetBreakdown.filter(asset => asset.position.borrowedUSD > 0).length === 0 && (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                No borrow positions yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Risk Analysis */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Risk Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LTV Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                LTV Ratio
              </span>
              <span className={`text-sm font-semibold ${
                ltv > 75 ? 'text-red-600' :
                ltv > 60 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {ltv.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  ltv > 75 ? 'bg-red-500' :
                  ltv > 60 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(ltv, 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {ltv < 60 ? 'Safe' : ltv < 75 ? 'Moderate Risk' : 'High Risk'}
            </div>
          </div>

          {/* Health Factor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Health Factor
              </span>
              <span className={`text-sm font-semibold ${riskLevel.color.replace('text-', '')}`}>
                {userPosition.healthFactor === Infinity ? '∞' : userPosition.healthFactor.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  userPosition.healthFactor > 2 ? 'bg-green-500' :
                  userPosition.healthFactor > 1.2 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ 
                  width: userPosition.healthFactor === Infinity ? '100%' : 
                         `${Math.min(Math.max((userPosition.healthFactor - 1) * 50, 10), 100)}%` 
                }}
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {riskLevel.label}
            </div>
          </div>

          {/* Borrow Limit Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Borrow Limit Used
              </span>
              <span className={`text-sm font-semibold ${
                userPosition.borrowLimitUsed > 90 ? 'text-red-600' :
                userPosition.borrowLimitUsed > 80 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {formatPercentage(userPosition.borrowLimitUsed)}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  userPosition.borrowLimitUsed > 90 ? 'bg-red-500' :
                  userPosition.borrowLimitUsed > 80 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(userPosition.borrowLimitUsed, 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {formatUSD(availableBorrow)} available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton
function UserOverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg loading-skeleton" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded loading-skeleton" />
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded loading-skeleton" />
              </div>
            </div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded loading-skeleton" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 card-shadow">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded loading-skeleton mb-4" />
        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded loading-skeleton" />
      </div>
    </div>
  );
}

// Empty state
function EmptyUserOverview() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-12 card-shadow text-center">
      <PiggyBank className="w-16 h-16 mx-auto text-slate-400 mb-4" />
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        No positions yet
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Start by supplying assets to earn interest or borrow against your collateral.
      </p>
      <div className="flex justify-center space-x-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Supply Assets
        </button>
        <button className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          Learn More
        </button>
      </div>
    </div>
  );
}