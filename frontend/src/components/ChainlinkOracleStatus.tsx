// src/components/ChainlinkOracleStatus.tsx
'use client';

import { useChainlinkOracle } from '@/hooks/useChainlinkOracle';
import { formatEther } from 'viem';

interface ChainlinkOracleStatusProps {
  className?: string;
}

export function ChainlinkOracleStatus({ className = '' }: ChainlinkOracleStatusProps) {
  const oracleData = useChainlinkOracle();

  const formatPrice = (price: bigint | null): string => {
    if (!price) return 'N/A';
    return `$${Number(formatEther(price)).toFixed(2)}`;
  };

  const formatTimestamp = (timestamp: bigint | null): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const getHealthBadge = (healthy: boolean | null, reason: string | null) => {
    if (healthy === null) return <span className="text-gray-400">Unknown</span>;
    
    if (healthy) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          ✅ Healthy
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          ❌ {reason || 'Unhealthy'}
        </span>
      );
    }
  };

  const getStaleBadge = (isStale: boolean | null) => {
    if (isStale === null) return <span className="text-gray-400">Unknown</span>;
    
    if (isStale) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          ⚠️ Stale
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          ✅ Fresh
        </span>
      );
    }
  };

  const getEmergencyBadge = (useEmergency: boolean | null, emergencyPrice: bigint | null) => {
    if (useEmergency === null) return <span className="text-gray-400">Unknown</span>;
    
    if (useEmergency) {
      return (
        <div className="inline-flex flex-col">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            ⚠️ Emergency Mode
          </span>
          {emergencyPrice && (
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Price: {formatPrice(emergencyPrice)}
            </span>
          )}
        </div>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          ✅ Normal
        </span>
      );
    }
  };

  if (oracleData.isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          🔗 Chainlink Oracle Status
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Real-time Price Feeds
        </div>
      </div>

      {/* Price Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">ETH Price</h3>
            <img src="/Eth_logo.png" alt="ETH" className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {formatPrice(oracleData.prices.lETH)}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              {getHealthBadge(oracleData.health.lETH.healthy, oracleData.health.lETH.reason)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Freshness:</span>
              {getStaleBadge(oracleData.metadata.lETH.isStale)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mode:</span>
              {getEmergencyBadge(oracleData.emergency.lETH.useEmergency, oracleData.emergency.lETH.emergencyPrice)}
            </div>
            {oracleData.metadata.lETH.updatedAt && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {formatTimestamp(oracleData.metadata.lETH.updatedAt)}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">USDC Price</h3>
            <img src="/usdc_logo.png" alt="USDC" className="w-6 h-6" />
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
            {formatPrice(oracleData.prices.lUSDC)}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              {getHealthBadge(oracleData.health.lUSDC.healthy, oracleData.health.lUSDC.reason)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Freshness:</span>
              {getStaleBadge(oracleData.metadata.lUSDC.isStale)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mode:</span>
              {getEmergencyBadge(oracleData.emergency.lUSDC.useEmergency, oracleData.emergency.lUSDC.emergencyPrice)}
            </div>
            {oracleData.metadata.lUSDC.updatedAt && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {formatTimestamp(oracleData.metadata.lUSDC.updatedAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Oracle Configuration */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Oracle Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Min Price</div>
            <div className="font-mono text-sm">
              {oracleData.constants.minPrice ? formatPrice(oracleData.constants.minPrice) : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Max Price</div>
            <div className="font-mono text-sm">
              {oracleData.constants.maxPrice ? formatPrice(oracleData.constants.maxPrice) : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ETH Staleness</div>
            <div className="font-mono text-sm">
              {oracleData.constants.ethMaxAge ? `${Number(oracleData.constants.ethMaxAge)}s` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">1 hour (volatile)</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">USDC Staleness</div>
            <div className="font-mono text-sm">
              {oracleData.constants.usdcMaxAge ? `${Number(oracleData.constants.usdcMaxAge)}s` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">25 hours (stablecoin)</div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {oracleData.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Errors</h3>
          <div className="space-y-1">
            {oracleData.errors.map((error, index) => (
              <div key={index} className="text-sm text-red-700 dark:text-red-300">
                {error.toString()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Badge */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="text-blue-400">ℹ️</div>
          </div>
          <div className="ml-3">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Chainlink Integration Active</strong>
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              Enhanced V2 Oracle with flexible staleness: ETH (1h) & USDC (25h). Real-time Chainlink 
              price feeds with intelligent asset classification and emergency fallbacks.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}