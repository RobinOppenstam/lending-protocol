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
        ...contracts.chainlinkPriceOracle,
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

  const marketData: MarketData | undefined = data && market ? (() => {
    // Raw data from contract
    const lTokenTotalSupply = data[0]?.status === 'success' ? data[0].result as bigint : BigInt(0);
    const totalBorrows = data[1]?.status === 'success' ? data[1].result as bigint : BigInt(0);
    const supplyRate = data[2]?.status === 'success' ? data[2].result as bigint : BigInt(0);
    const borrowRate = data[3]?.status === 'success' ? data[3].result as bigint : BigInt(0);
    const exchangeRate = data[4]?.status === 'success' ? data[4].result as bigint : BigInt('1000000000000000000'); // 1e18
    const cash = data[5]?.status === 'success' ? data[5].result as bigint : BigInt(0);
    const priceFromOracle = data[6]?.status === 'success' && data[6].result !== undefined ? 
      Number(formatUnits(data[6].result as bigint, 18)) : 
      fallbackPrices[market.symbol as keyof typeof fallbackPrices] || 1;
    
    // IMPORTANT: totalSupply in contract is lToken supply, not underlying supply
    // Underlying supply = lTokenSupply * exchangeRate / 1e18
    const underlyingTotalSupply = (lTokenTotalSupply * exchangeRate) / BigInt(1e18);
    
    console.log(`🔍 MARKET DATA DEBUG (${market.symbol}):`, {
      lTokenTotalSupply: lTokenTotalSupply.toString(),
      exchangeRate: exchangeRate.toString(),
      underlyingTotalSupply: underlyingTotalSupply.toString(),
      totalBorrows: totalBorrows.toString(),
      cash: cash.toString(),
      exchangeRateFormatted: Number(exchangeRate) / 1e18,
      underlyingSupplyFormatted: Number(underlyingTotalSupply) / (market.decimals === 6 ? 1e6 : 1e18),
      borrowsFormatted: Number(totalBorrows) / (market.decimals === 6 ? 1e6 : 1e18),
      cashFormatted: Number(cash) / (market.decimals === 6 ? 1e6 : 1e18),
      sanityCheck: {
        exchangeRateReasonable: Number(exchangeRate) / 1e18 >= 1.0 && Number(exchangeRate) / 1e18 <= 10.0,
        borrowsLessthan: underlyingTotalSupply >= totalBorrows ? 'Supply ≥ Borrows ✅' : 'Supply < Borrows ❌',
      }
    });
    
    return {
      totalSupply: underlyingTotalSupply, // Use underlying supply, not lToken supply
      totalBorrows,
      supplyRate,
      borrowRate,
      exchangeRate,
      cash,
      utilizationRate: calculateUtilizationRate(totalBorrows, cash),
      userSupplyBalance: BigInt(0),
      userBorrowBalance: BigInt(0),
      userCollateralValue: 0,
      supplyAPY: calculateAPY({ ratePerBlock: supplyRate }),
      borrowAPY: calculateAPY({ ratePerBlock: borrowRate }),
      liquidity: Number(formatUnits(cash, market.decimals)),
      price: priceFromOracle,
    };
  })() : undefined;

  return {
    marketData,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
