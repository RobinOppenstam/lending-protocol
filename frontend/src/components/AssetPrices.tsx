// src/components/AssetPrices.tsx
'use client';

import { useOraclePrices } from '@/hooks/useOraclePrices';
import { formatEther } from 'viem';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import Image from 'next/image';

interface AssetPricesProps {
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export function AssetPrices({ 
  className = '', 
  showHeader = true, 
  compact = false 
}: AssetPricesProps) {
  const { prices, isLoading } = useOraclePrices();

  const formatPrice = (price: bigint | null | undefined): string => {
    if (!price) return 'N/A';
    const formattedPrice = Number(formatEther(price));
    return formattedPrice.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getPriceChangeIcon = (symbol: string) => {
    // Mock price changes - in a real app, you'd track historical prices
    const mockChanges = {
      'ETH': 2.5, // +2.5%
      'USDC': 0.1, // +0.1%
    };
    
    const change = mockChanges[symbol as keyof typeof mockChanges] || 0;
    
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriceChangeText = (symbol: string) => {
    // Mock price changes - in a real app, you'd track historical prices
    const mockChanges = {
      'ETH': 2.5, // +2.5%
      'USDC': 0.1, // +0.1%
    };
    
    const change = mockChanges[symbol as keyof typeof mockChanges] || 0;
    const colorClass = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500';
    const sign = change > 0 ? '+' : '';
    
    return (
      <span className={`text-sm font-medium ${colorClass}`}>
        {sign}{change.toFixed(2)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-card rounded-xl p-6 card-shadow ${className}`}>
        {showHeader && !compact && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-card-foreground">
              Asset Prices
            </h3>
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
        
        <div className="space-y-4">
          {/* Loading skeletons */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-secondary rounded-full"></div>
                  <div>
                    <div className="h-4 bg-secondary rounded w-16 mb-2"></div>
                    <div className="h-3 bg-secondary rounded w-12"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-6 bg-secondary rounded w-20 mb-2"></div>
                  <div className="h-4 bg-secondary rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const assets = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      icon: '/Eth_logo.png',
      price: prices?.lETHPrice,
      error: prices?.errors.lETH
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      icon: '/usdc_logo.png',
      price: prices?.lUSDCPrice,
      error: prices?.errors.lUSDC
    },
    {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
      price: prices?.lWBTCPrice,
      error: prices?.errors.lWBTC
    },
    {
      symbol: 'LINK',
      name: 'Chainlink',
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png',
      price: prices?.lLINKPrice,
      error: prices?.errors.lLINK
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      price: prices?.lUSDTPrice,
      error: prices?.errors.lUSDT
    }
  ];

  if (compact) {
    return (
      <div className={`flex space-x-4 ${className}`}>
        {assets.map((asset) => (
          <div key={asset.symbol} className="flex items-center space-x-2">
            <Image 
              src={asset.icon} 
              alt={`${asset.symbol} logo`}
              width={20}
              height={20}
              className="rounded-full"
              onError={(e) => {
                // Fallback to a placeholder or generic token icon
                e.currentTarget.src = '/file.svg';
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-card-foreground">
                {asset.symbol}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatPrice(asset.price)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-xl p-6 card-shadow ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-card-foreground">
            Live Asset Prices
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {assets.map((asset) => (
          <div
            key={asset.symbol}
            className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image 
                  src={asset.icon} 
                  alt={`${asset.symbol} logo`}
                  width={40}
                  height={40}
                  className="rounded-full"
                  onError={(e) => {
                    // Fallback to a placeholder or generic token icon
                    e.currentTarget.src = '/file.svg';
                  }}
                />
                {/* Status indicator */}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                  asset.error ? 'bg-red-500' : 'bg-green-500'
                }`}></div>
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-semibold text-card-foreground">
                    {asset.symbol}
                  </h4>
                  {getPriceChangeIcon(asset.symbol)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {asset.name}
                </p>
              </div>
            </div>

            <div className="text-right">
              {asset.error ? (
                <div className="space-y-1">
                  <p className="text-lg font-bold text-red-600">
                    Error
                  </p>
                  <p className="text-xs text-red-500">
                    Price unavailable
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-card-foreground">
                    {formatPrice(asset.price)}
                  </p>
                  <div className="flex items-center justify-end space-x-1">
                    {getPriceChangeText(asset.symbol)}
                    <span className="text-xs text-muted-foreground">
                      24h
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Oracle info */}
      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Powered by Chainlink
            </span>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-300">
            Decentralized Price Feeds
          </span>
        </div>
      </div>

      {/* Error summary */}
      {(prices?.errors.lETH || prices?.errors.lUSDC || prices?.errors.lWBTC || prices?.errors.lLINK || prices?.errors.lUSDT) && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-red-500">⚠️</div>
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Price Feed Issues
              </p>
              <div className="text-xs text-red-600 dark:text-red-300 mt-1 space-y-1">
                {prices?.errors.lETH && (
                  <div>ETH: {prices.errors.lETH.toString()}</div>
                )}
                {prices?.errors.lUSDC && (
                  <div>USDC: {prices.errors.lUSDC.toString()}</div>
                )}
                {prices?.errors.lWBTC && (
                  <div>WBTC: {prices.errors.lWBTC.toString()}</div>
                )}
                {prices?.errors.lLINK && (
                  <div>LINK: {prices.errors.lLINK.toString()}</div>
                )}
                {prices?.errors.lUSDT && (
                  <div>USDT: {prices.errors.lUSDT.toString()}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}