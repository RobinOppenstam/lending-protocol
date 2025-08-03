// src/hooks/useUserPosition.ts
import { useAccount, useReadContracts } from 'wagmi';
import { contracts, markets } from '@/config/contracts';
import { UserPosition, UseUserPositionReturn } from '@/types/defi';
import { calculateAPY } from '@/lib/utils';

// Store previous data for comparison
let previousPositionData: any = null;

export function useUserPosition(): UseUserPositionReturn {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      // Get account liquidity
      {
        ...contracts.comptroller,
        functionName: 'getAccountLiquidity',
        args: [address!],
      },
      // User's lUSDC balance
      {
        ...contracts.lUSDC,
        functionName: 'accountTokens',
        args: [address!],
      },
      // User's USDC borrow balance
      {
        ...contracts.lUSDC,
        functionName: 'borrowBalanceStored',
        args: [address!],
      },
      // User's lETH balance
      {
        ...contracts.lETH,
        functionName: 'accountTokens',
        args: [address!],
      },
      // User's ETH borrow balance
      {
        ...contracts.lETH,
        functionName: 'borrowBalanceStored',
        args: [address!],
      },
      // Exchange rates for conversion
      {
        ...contracts.lUSDC,
        functionName: 'exchangeRateStored',
      },
      {
        ...contracts.lETH,
        functionName: 'exchangeRateStored',
      },
      // Market rates for APY calculation
      {
        ...contracts.lUSDC,
        functionName: 'getSupplyRate',
      },
      {
        ...contracts.lUSDC,
        functionName: 'getBorrowRate',
      },
      {
        ...contracts.lETH,
        functionName: 'getSupplyRate',
      },
      {
        ...contracts.lETH,
        functionName: 'getBorrowRate',
      },
    ],
    query: {
      enabled: !!address,
      staleTime: 5000, // 5 seconds - refresh more frequently
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Debug logging
  console.log('useUserPosition debug:', {
    address,
    hasData: !!data,
    dataLength: data?.length,
    isLoading,
    error,
    contractResults: data?.map((result, index) => ({
      index,
      status: result.status,
      error: result.error,
      result: result.status === 'success' ? 'success' : 'failed'
    }))
  });

  const userPosition: UserPosition | undefined = data && address ? (() => {
    
    // Parse data with fallbacks - handle failures gracefully
    const accountLiquidity = data[0]?.status === 'success' ? data[0].result as [bigint, bigint] : [BigInt(0), BigInt(0)];
    const lUSDCBalance = data[1]?.status === 'success' ? data[1].result as bigint : BigInt(0);
    const usdcBorrowBalance = data[2]?.status === 'success' ? data[2].result as bigint : BigInt(0);
    const lETHBalance = data[3]?.status === 'success' ? data[3].result as bigint : BigInt(0);
    const ethBorrowBalance = data[4]?.status === 'success' ? data[4].result as bigint : BigInt(0);
    const usdcExchangeRate = data[5]?.status === 'success' ? data[5].result as bigint : BigInt(1e18);
    const ethExchangeRate = data[6]?.status === 'success' ? data[6].result as bigint : BigInt(1e18);
    
    // Market rates for APY calculation
    const usdcSupplyRate = data[7]?.status === 'success' ? data[7].result as bigint : BigInt(0);
    const usdcBorrowRate = data[8]?.status === 'success' ? data[8].result as bigint : BigInt(0);
    const ethSupplyRate = data[9]?.status === 'success' ? data[9].result as bigint : BigInt(0);
    const ethBorrowRate = data[10]?.status === 'success' ? data[10].result as bigint : BigInt(0);
    
    // Log extreme interest rates that could cause the explosion
    if (usdcBorrowRate > BigInt(1e18)) { // More than 100% per block
      console.error('🚨 EXTREME BORROW RATE DETECTED:', {
        usdcBorrowRate: usdcBorrowRate.toString(),
        usdcBorrowRateFormatted: `${Number(usdcBorrowRate) / 1e18 * 100}% per block`,
        annualizedRate: `${Number(usdcBorrowRate) / 1e18 * 2628000 * 100}% per year`,
        thisWillCauseExplosion: true
      });
    }
    
    // Calculate APY values
    const usdcSupplyAPY = calculateAPY({ ratePerBlock: usdcSupplyRate });
    const usdcBorrowAPY = calculateAPY({ ratePerBlock: usdcBorrowRate });
    const ethSupplyAPY = calculateAPY({ ratePerBlock: ethSupplyRate });
    const ethBorrowAPY = calculateAPY({ ratePerBlock: ethBorrowRate });
    
    // Calculate underlying amounts - using new fixed contracts
    const usdcSupplied = (lUSDCBalance * usdcExchangeRate) / BigInt(1e18);
    const ethSupplied = (lETHBalance * ethExchangeRate) / BigInt(1e18);
    
    // Use fallback prices (should be fetched from oracle in production)
    const usdcPrice = 1; // $1 for USDC
    const ethPrice = 2000; // $2000 for ETH (should come from oracle)
    
    // Calculate USD values
    const usdcSuppliedUSD = Number(usdcSupplied) / 1e6 * usdcPrice; // USDC has 6 decimals
    const ethSuppliedUSD = Number(ethSupplied) / 1e18 * ethPrice; // ETH has 18 decimals
    const usdcBorrowedUSD = Number(usdcBorrowBalance) / 1e6 * usdcPrice;
    const ethBorrowedUSD = Number(ethBorrowBalance) / 1e18 * ethPrice;
    
    const totalSuppliedUSD = usdcSuppliedUSD + ethSuppliedUSD;
    const totalBorrowedUSD = usdcBorrowedUSD + ethBorrowedUSD;
    
    // accountLiquidity[0] is remaining available to borrow, not total limit
    const comptrollerBorrowCapacityUSD = Number(accountLiquidity[0]) / 1e18;
    
    // Calculate expected borrow power manually for comparison
    const expectedUSDCBorrowPower = usdcSuppliedUSD * 0.8; // 80% collateral factor
    const expectedETHBorrowPower = ethSuppliedUSD * 0.75; // 75% collateral factor
    const expectedTotalBorrowPower = expectedUSDCBorrowPower + expectedETHBorrowPower;
    const expectedAvailableToBorrow = expectedTotalBorrowPower - totalBorrowedUSD;
    
    // Use expected calculation if comptroller seems wrong (temporary fix)
    const remainingBorrowCapacityUSD = Math.max(comptrollerBorrowCapacityUSD, expectedAvailableToBorrow);
    const borrowLimitUSD = totalBorrowedUSD + remainingBorrowCapacityUSD;
    const borrowLimitUsed = borrowLimitUSD > 0 ? (totalBorrowedUSD / borrowLimitUSD) * 100 : 0;
    const healthFactor = totalBorrowedUSD > 0 ? (totalSuppliedUSD * 0.85) / totalBorrowedUSD : Infinity;

    // Compare with previous data to detect changes
    const currentData = {
      totalSuppliedUSD,
      totalBorrowedUSD,
      lUSDCBalance: lUSDCBalance.toString(),
      usdcBorrowBalance: usdcBorrowBalance.toString(),
      usdcExchangeRate: usdcExchangeRate.toString(),
    };

    if (previousPositionData) {
      const suppliedChange = totalSuppliedUSD - previousPositionData.totalSuppliedUSD;
      const borrowedChange = totalBorrowedUSD - previousPositionData.totalBorrowedUSD;
      const lUSDCBalanceChange = BigInt(lUSDCBalance.toString()) - BigInt(previousPositionData.lUSDCBalance);
      const usdcBorrowBalanceChange = BigInt(usdcBorrowBalance.toString()) - BigInt(previousPositionData.usdcBorrowBalance);
      const exchangeRateChange = BigInt(usdcExchangeRate.toString()) - BigInt(previousPositionData.usdcExchangeRate);

      console.log('🔍 PORTFOLIO CHANGE ANALYSIS:', {
        address,
        timestamp: new Date().toISOString(),
        changes: {
          totalSuppliedUSD: {
            previous: previousPositionData.totalSuppliedUSD,
            current: totalSuppliedUSD,
            change: suppliedChange,
            isUnexpectedIncrease: suppliedChange > 0.01 // Unexpected supply increase
          },
          totalBorrowedUSD: {
            previous: previousPositionData.totalBorrowedUSD,
            current: totalBorrowedUSD,
            change: borrowedChange,
            isUnexpectedIncrease: borrowedChange > 0.01 // Unexpected borrow increase
          },
          lUSDCBalance: {
            previous: previousPositionData.lUSDCBalance,
            current: lUSDCBalance.toString(),
            change: lUSDCBalanceChange.toString(),
            note: 'lToken balance should not change during repay'
          },
          usdcBorrowBalance: {
            previous: previousPositionData.usdcBorrowBalance,
            current: usdcBorrowBalance.toString(),
            change: usdcBorrowBalanceChange.toString(),
            note: 'borrow balance should decrease during repay'
          },
          usdcExchangeRate: {
            previous: previousPositionData.usdcExchangeRate,
            current: usdcExchangeRate.toString(),
            change: exchangeRateChange.toString(),
            note: 'exchange rate increases over time due to interest'
          }
        },
        suspectedIssue: {
          exchangeRateIncreaseAffectingSupply: exchangeRateChange > 0n && suppliedChange > 0.01,
          explanation: 'Exchange rate increases due to accrued interest, making lTokens worth more underlying tokens'
        }
      });
    }

    previousPositionData = currentData;

    console.log('User position data DETAILED:', {
      address,
      timestamp: new Date().toISOString(),
      rawContractData: {
        lUSDCBalance: lUSDCBalance.toString(),
        usdcBorrowBalance: usdcBorrowBalance.toString(),
        lETHBalance: lETHBalance.toString(),
        ethBorrowBalance: ethBorrowBalance.toString(),
        usdcExchangeRate: usdcExchangeRate.toString(),
        ethExchangeRate: ethExchangeRate.toString(),
      },
      interestRateDebugging: {
        usdcSupplyRate: usdcSupplyRate.toString(),
        usdcBorrowRate: usdcBorrowRate.toString(),
        usdcSupplyRateFormatted: `${Number(usdcSupplyRate) / 1e18 * 100}% per block`,
        usdcBorrowRateFormatted: `${Number(usdcBorrowRate) / 1e18 * 100}% per block`,
        usdcSupplyAPY: `${Number(usdcSupplyRate) / 1e18 * 2628000 * 100}% per year`,
        usdcBorrowAPY: `${Number(usdcBorrowRate) / 1e18 * 2628000 * 100}% per year`,
        warning: Number(usdcBorrowRate) > 1e16 ? '⚠️ HIGH RATE - This could cause account explosion' : 'Normal',
      },
      calculationDetails: {
        usdcSupplied_calculation: `(${lUSDCBalance.toString()} * ${usdcExchangeRate.toString()}) / 1e18 = ${usdcSupplied.toString()}`,
        ethSupplied_calculation: `(${lETHBalance.toString()} * ${ethExchangeRate.toString()}) / 1e18 = ${ethSupplied.toString()}`,
        usdcSuppliedUSD_calculation: `${Number(usdcSupplied)} / 1e6 * ${usdcPrice} = ${usdcSuppliedUSD}`,
        ethSuppliedUSD_calculation: `${Number(ethSupplied)} / 1e18 * ${ethPrice} = ${ethSuppliedUSD}`,
        usdcBorrowedUSD_calculation: `${Number(usdcBorrowBalance)} / 1e6 * ${usdcPrice} = ${usdcBorrowedUSD}`,
        ethBorrowedUSD_calculation: `${Number(ethBorrowBalance)} / 1e18 * ${ethPrice} = ${ethBorrowedUSD}`,
      },
      supplies: {
        usdcSuppliedUSD,
        ethSuppliedUSD,
        totalSuppliedUSD,
      },
      borrows: {
        usdcBorrowedUSD,
        ethBorrowedUSD,
        totalBorrowedUSD,
      },
      comptrollerData: {
        accountLiquidity: accountLiquidity.map(x => x.toString()),
        liquidityInETH: `${Number(accountLiquidity[0]) / 1e18} ETH-equivalent`,
        comptrollerBorrowCapacityUSD,
        remainingBorrowCapacityUSD,
        borrowLimitUSD,
        borrowLimitUsed: `${borrowLimitUsed.toFixed(1)}%`,
      },
      expectedCalculations: {
        expectedUSDCBorrowPower: `$${expectedUSDCBorrowPower.toFixed(2)}`,
        expectedETHBorrowPower: `$${expectedETHBorrowPower.toFixed(2)}`,
        expectedTotalBorrowPower: `$${expectedTotalBorrowPower.toFixed(2)}`,
        expectedAvailableToBorrow: `$${expectedAvailableToBorrow.toFixed(2)}`,
      },
      issue: {
        comptrollerReturns: `$${comptrollerBorrowCapacityUSD.toFixed(2)}`,
        shouldReturn: `$${expectedAvailableToBorrow.toFixed(2)}`,
        usingValue: `$${remainingBorrowCapacityUSD.toFixed(2)}`,
        difference: `$${(expectedAvailableToBorrow - comptrollerBorrowCapacityUSD).toFixed(2)}`,
        possibleCause: 'getAccountLiquidity might be using different prices or collateral factors'
      }
    });
    
    return {
      totalSuppliedUSD,
      totalBorrowedUSD,
      totalCollateralUSD: totalSuppliedUSD,
      borrowLimitUSD,
      borrowLimitUsed,
      liquidationThreshold: 0.85,
      healthFactor,
      positions: {
        lUSDC: {
          supplied: lUSDCBalance,
          borrowed: usdcBorrowBalance,
          suppliedUSD: usdcSuppliedUSD,
          borrowedUSD: usdcBorrowedUSD,
          apy: { supply: usdcSupplyAPY, borrow: usdcBorrowAPY },
        },
        lETH: {
          supplied: lETHBalance,
          borrowed: ethBorrowBalance,
          suppliedUSD: ethSuppliedUSD,
          borrowedUSD: ethBorrowedUSD,
          apy: { supply: ethSupplyAPY, borrow: ethBorrowAPY },
        },
      },
    };
  })() : undefined;

  return {
    userPosition,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}