// src/hooks/useMarketData.ts
import { useReadContracts, useBlockNumber } from 'wagmi';
import { formatUnits } from 'viem';
import { contracts, markets } from '@/config/contracts';
import { MarketData, UseMarketDataReturn } from '@/types/defi';
import { calculateUtilizationRate, calculateAPY } from '@/lib/utils';

export function useMarketData(marketAddress: `0x${string}`): UseMarketDataReturn {
  const { data: blockNumber } = useBlockNumber({ watch: true });
  
  const market = markets.find(m => m.lTokenAddress === marketAddress);
  const isUSDC = market?.symbol === 'lUSDC';
  const contractConfig = isUSDC ? contracts.lUSDC : contracts.lETH;
  
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        ...contractConfig,
        address: marketAddress,
        functionName: 'totalSupply',
      },
      {
        ...contractConfig,
        address: marketAddress,
        functionName: 'totalBorrows',
      },
      {
        ...contractConfig,
        address: marketAddress,
        functionName: 'getSupplyRate',
      },
      {
        ...contractConfig,
        address: marketAddress,
        functionName: 'getBorrowRate',
      },
      {
        ...contractConfig,
        address: marketAddress,
        functionName: 'exchangeRateStored',
      },
      {
        ...contractConfig,
        address: marketAddress,
        functionName: 'getCash',
      },
      {
        ...contracts.priceOracle,
        functionName: 'getUnderlyingPrice',
        args: [marketAddress],
      },
    ],
    query: {
      enabled: !!marketAddress,
      staleTime: 30000, // 30 seconds
    },
  });

  // Fallback prices for testing when oracle prices aren't set
  const fallbackPrices = {
    'lUSDC': 1, // $1 for USDC
    'lETH': 2000, // $2000 for ETH
  };

  const marketData: MarketData | undefined = data && market ? {
    totalSupply: data[0]?.status === 'success' ? data[0].result as bigint : BigInt(0),
    totalBorrows: data[1]?.status === 'success' ? data[1].result as bigint : BigInt(0),
    supplyRate: data[2]?.status === 'success' ? data[2].result as bigint : BigInt(0),
    borrowRate: data[3]?.status === 'success' ? data[3].result as bigint : BigInt(0),
    exchangeRate: data[4]?.status === 'success' ? data[4].result as bigint : BigInt('1000000000000000000'), // 1e18
    cash: data[5]?.status === 'success' ? data[5].result as bigint : BigInt(0),
    utilizationRate: data[1]?.status === 'success' && data[5]?.status === 'success' ? 
      calculateUtilizationRate(data[1].result as bigint, data[5].result as bigint) : 0,
    userSupplyBalance: BigInt(0),
    userBorrowBalance: BigInt(0),
    userCollateralValue: 0,
    supplyAPY: data[2]?.status === 'success' ? 
      calculateAPY({ ratePerBlock: data[2].result as bigint }) : 0,
    borrowAPY: data[3]?.status === 'success' ? 
      calculateAPY({ ratePerBlock: data[3].result as bigint }) : 0,
    liquidity: data[5]?.status === 'success' ? 
      Number(formatUnits(data[5].result as bigint, market.decimals)) : 0,
    price: data[6]?.status === 'success' && data[6].result !== undefined ? 
      Number(formatUnits(data[6].result as bigint, 18)) : 
      fallbackPrices[market.symbol as keyof typeof fallbackPrices] || 1,
  } : undefined;

  return {
    marketData,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
