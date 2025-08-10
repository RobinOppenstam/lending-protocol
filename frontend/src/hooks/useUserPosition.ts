// src/hooks/useUserPosition.ts
import { useAccount, useReadContracts } from 'wagmi';
import { contracts, markets } from '@/config/contracts';
import { UserPosition, UseUserPositionReturn } from '@/types/defi';
import { calculateAPY, calculateHealthFactor } from '@/lib/utils';
import { useOraclePrices } from './useOraclePrices';

// Store previous data for comparison
let previousPositionData: any = null;

export function useUserPosition(): UseUserPositionReturn {
  const { address } = useAccount();
  const { prices: oraclePrices } = useOraclePrices();

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

  // Debug logging with detailed contract call analysis
  console.log('useUserPosition debug:', {
    address,
    hasData: !!data,
    dataLength: data?.length,
    isLoading,
    error,
    contractResults: data?.map((result, index) => {
      const callNames = [
        'comptroller.getAccountLiquidity',
        'lUSDC.accountTokens', 
        'lUSDC.borrowBalanceStored',
        'lETH.accountTokens',
        'lETH.borrowBalanceStored', 
        'lUSDC.exchangeRateStored',
        'lETH.exchangeRateStored',
        'lUSDC.getSupplyRate',
        'lUSDC.getBorrowRate',
        'lETH.getSupplyRate', 
        'lETH.getBorrowRate'
      ];
      return {
        index,
        callName: callNames[index] || `call_${index}`,
        status: result.status,
        error: result.error?.message || null,
        hasResult: result.status === 'success' && result.result !== undefined,
        resultPreview: result.status === 'success' ? 
          (typeof result.result === 'bigint' ? result.result.toString().slice(0, 20) + '...' : 
           Array.isArray(result.result) ? `[${result.result.length} items]` : 
           String(result.result).slice(0, 20) + '...') : 'failed'
      };
    })
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
    
    // Log all interest rates to debug the issue
    console.log('🔍 RAW INTEREST RATES DEBUG:', {
      rates: {
        usdcSupplyRate: usdcSupplyRate.toString(),
        usdcBorrowRate: usdcBorrowRate.toString(),
        ethSupplyRate: ethSupplyRate.toString(),
        ethBorrowRate: ethBorrowRate.toString(),
      },
      formatted: {
        usdcSupplyRatePerBlock: `${Number(usdcSupplyRate) / 1e18}`,
        usdcBorrowRatePerBlock: `${Number(usdcBorrowRate) / 1e18}`,
        ethSupplyRatePerBlock: `${Number(ethSupplyRate) / 1e18}`,
        ethBorrowRatePerBlock: `${Number(ethBorrowRate) / 1e18}`,
      },
      annualized: {
        usdcSupplyAPY: `${Number(usdcSupplyRate) / 1e18 * 2628000 * 100}%`,
        usdcBorrowAPY: `${Number(usdcBorrowRate) / 1e18 * 2628000 * 100}%`,
        ethSupplyAPY: `${Number(ethSupplyRate) / 1e18 * 2628000 * 100}%`,
        ethBorrowAPY: `${Number(ethBorrowRate) / 1e18 * 2628000 * 100}%`,
      },
      warning: Number(usdcBorrowRate) > 1e18 || Number(ethBorrowRate) > 1e18 ? '⚠️ EXTREME RATES DETECTED' : 'Rates look normal'
    });
    
    // Calculate APY values with detailed USDC debugging
    console.log('🔍 USDC SPECIFIC DEBUG:', {
      usdcSupplyRate: {
        raw: usdcSupplyRate.toString(),
        decimal: Number(usdcSupplyRate) / 1e18,
        isZero: usdcSupplyRate === BigInt(0),
      },
      usdcBorrowRate: {
        raw: usdcBorrowRate.toString(),
        decimal: Number(usdcBorrowRate) / 1e18,
        isZero: usdcBorrowRate === BigInt(0),
      }
    });

    const usdcSupplyAPY = calculateAPY({ ratePerBlock: usdcSupplyRate });
    const usdcBorrowAPY = calculateAPY({ ratePerBlock: usdcBorrowRate });
    const ethSupplyAPY = calculateAPY({ ratePerBlock: ethSupplyRate });
    const ethBorrowAPY = calculateAPY({ ratePerBlock: ethBorrowRate });
    
    console.log('🔍 CALCULATED APYs:', {
      usdcSupplyAPY,
      usdcBorrowAPY,
      ethSupplyAPY,
      ethBorrowAPY,
      usdcIssue: usdcSupplyAPY > 100 || usdcBorrowAPY > 100 ? 'USDC APY too high' : 'USDC APY looks OK'
    });
    
    // Debug exchange rates and balances
    console.log('🔍 EXCHANGE RATES & BALANCES DEBUG:', {
      rawBalances: {
        lUSDCBalance: lUSDCBalance.toString(),
        lETHBalance: lETHBalance.toString(),
        usdcBorrowBalance: usdcBorrowBalance.toString(),
        ethBorrowBalance: ethBorrowBalance.toString(),
      },
      exchangeRates: {
        usdcExchangeRate: usdcExchangeRate.toString(),
        ethExchangeRate: ethExchangeRate.toString(),
        usdcExchangeRateFormatted: Number(usdcExchangeRate) / 1e18,
        ethExchangeRateFormatted: Number(ethExchangeRate) / 1e18,
      }
    });

    // Calculate underlying amounts - exchange rates should be correct now
    const usdcSupplied = (lUSDCBalance * usdcExchangeRate) / BigInt(1e18);
    const ethSupplied = (lETHBalance * ethExchangeRate) / BigInt(1e18);
    
    console.log('🔍 CALCULATED UNDERLYING AMOUNTS:', {
      usdcSupplied: usdcSupplied.toString(),
      ethSupplied: ethSupplied.toString(),
      usdcSuppliedFormatted: Number(usdcSupplied) / 1e6, // USDC has 6 decimals
      ethSuppliedFormatted: Number(ethSupplied) / 1e18, // ETH has 18 decimals
    });
    
    // Get real prices from oracle with fallbacks
    const usdcPrice = oraclePrices?.lUSDCPrice ? Number(oraclePrices.lUSDCPrice) / 1e18 : 1;
    const ethPrice = oraclePrices?.lETHPrice ? Number(oraclePrices.lETHPrice) / 1e18 : 4212;

    // Detailed USDC value calculation debug
    const usdcSuppliedFormatted = Number(usdcSupplied) / 1e6;
    console.log('🔍 USDC VALUE CALCULATION BREAKDOWN:', {
      step1_lTokenBalance: {
        raw: lUSDCBalance.toString(),
        formatted: Number(lUSDCBalance) / 1e18, // lTokens have 18 decimals
      },
      step2_exchangeRate: {
        raw: usdcExchangeRate.toString(),
        formatted: Number(usdcExchangeRate) / 1e18,
        meaning: 'How many underlying tokens per lToken'
      },
      step3_underlyingCalculation: {
        formula: 'lTokenBalance * exchangeRate / 1e18',
        calculation: `${lUSDCBalance.toString()} * ${usdcExchangeRate.toString()} / 1e18`,
        result: usdcSupplied.toString(),
        resultFormatted: usdcSuppliedFormatted + ' USDC'
      },
      step4_priceConversion: {
        usdcPrice,
        formula: 'underlyingAmount * price',
        calculation: `${usdcSuppliedFormatted} * ${usdcPrice}`,
        finalUSD: usdcSuppliedFormatted * usdcPrice
      },
      possibleIssues: {
        exchangeRateTooHigh: Number(usdcExchangeRate) / 1e18 > 3,
        lTokenBalanceTooHigh: Number(lUSDCBalance) / 1e18 > 10000,
        priceWrong: usdcPrice < 0.99 || usdcPrice > 1.01,
        underlyingTooHigh: usdcSuppliedFormatted > 100000
      }
    });
    
    // Debug exchange rates - should be reasonable now  
    console.log('🔍 EXCHANGE RATE VALUES:', {
      usdc: {
        raw: usdcExchangeRate.toString(),
        formatted: Number(usdcExchangeRate) / 1e18,
        reasonable: Number(usdcExchangeRate) / 1e18 >= 1.0 && Number(usdcExchangeRate) / 1e18 <= 5.0
      },
      eth: {
        raw: ethExchangeRate.toString(),
        formatted: Number(ethExchangeRate) / 1e18,
        reasonable: Number(ethExchangeRate) / 1e18 >= 1.0 && Number(ethExchangeRate) / 1e18 <= 5.0
      }
    });
    
    // Calculate USD values using actual smart contract values
    const usdcSuppliedUSD = Number(usdcSupplied) / 1e6 * usdcPrice; // USDC has 6 decimals
    const ethSuppliedUSD = Number(ethSupplied) / 1e18 * ethPrice; // ETH has 18 decimals
    const usdcBorrowedUSD = Number(usdcBorrowBalance) / 1e6 * usdcPrice;
    const ethBorrowedUSD = Number(ethBorrowBalance) / 1e18 * ethPrice;
    
    console.log('🔍 USD VALUES DEBUG:', {
      usdcSuppliedUSD,
      ethSuppliedUSD,
      usdcBorrowedUSD,
      ethBorrowedUSD,
      totalSupplied: usdcSuppliedUSD + ethSuppliedUSD,
      totalBorrowed: usdcBorrowedUSD + ethBorrowedUSD,
      prices: { usdcPrice, ethPrice }
    });
    
    const totalSuppliedUSD = usdcSuppliedUSD + ethSuppliedUSD;
    const totalBorrowedUSD = usdcBorrowedUSD + ethBorrowedUSD;
    
    // Check if account has shortfall (underwater position)
    const shortfallETH = Number(accountLiquidity[1]) / 1e18;
    
    // Calculate total borrow limit based on collateral factors (this is the correct approach)
    const usdcBorrowPower = usdcSuppliedUSD * 0.8; // 80% collateral factor
    const ethBorrowPower = ethSuppliedUSD * 0.75; // 75% collateral factor
    const totalBorrowPower = usdcBorrowPower + ethBorrowPower;
    
    // If there's a shortfall, the borrow limit is just the current borrows (maxed out)
    // Otherwise, the borrow limit is the total borrow power based on collateral
    const effectiveBorrowLimitUSD = shortfallETH > 0 ? totalBorrowedUSD : totalBorrowPower;
    
    console.log('🎯 CORRECTED BORROW LIMIT CALCULATION:', {
      usdcSupplied: usdcSuppliedUSD,
      usdcBorrowPower: `$${usdcBorrowPower.toFixed(2)} (80% of $${usdcSuppliedUSD.toFixed(2)})`,
      ethSupplied: ethSuppliedUSD,
      ethBorrowPower: `$${ethBorrowPower.toFixed(2)} (75% of $${ethSuppliedUSD.toFixed(2)})`,
      totalBorrowLimit: `$${totalBorrowPower.toFixed(2)}`,
      currentBorrowed: `$${totalBorrowedUSD.toFixed(2)}`,
      availableToBorrow: `$${Math.max(0, totalBorrowPower - totalBorrowedUSD).toFixed(2)}`,
      hasShortfall: shortfallETH > 0,
      effectiveBorrowLimit: `$${effectiveBorrowLimitUSD.toFixed(2)}`
    });
    
    // Calculate utilization percentage
    const borrowLimitUsed = effectiveBorrowLimitUSD > 0 ? Math.min((totalBorrowedUSD / effectiveBorrowLimitUSD) * 100, 100) : 0;
    const healthFactor = calculateHealthFactor(totalSuppliedUSD, totalBorrowedUSD, 0.85);

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
        borrowLimitUSD: effectiveBorrowLimitUSD,
        borrowLimitUsed: `${borrowLimitUsed.toFixed(1)}%`,
        shortfall: shortfallETH > 0 ? `$${(shortfallETH * ethPrice).toFixed(2)}` : '$0',
      },
      borrowPowerAnalysis: {
        usdcBorrowPower: `$${usdcBorrowPower.toFixed(2)}`,
        ethBorrowPower: `$${ethBorrowPower.toFixed(2)}`,
        totalBorrowPower: `$${totalBorrowPower.toFixed(2)}`,
        availableToBorrow: `$${Math.max(0, totalBorrowPower - totalBorrowedUSD).toFixed(2)}`,
        calculationMethod: 'Using collateral factors instead of comptroller liquidity',
      }
    });
    
    return {
      totalSuppliedUSD,
      totalBorrowedUSD,
      totalCollateralUSD: totalSuppliedUSD,
      borrowLimitUSD: effectiveBorrowLimitUSD,
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