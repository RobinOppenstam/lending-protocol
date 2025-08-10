// src/hooks/useChainlinkOracle.ts
import { useReadContracts } from 'wagmi';
import { contracts } from '@/config/contracts';

export interface ChainlinkOracleData {
  prices: {
    lETH: bigint | null;
    lUSDC: bigint | null;
  };
  metadata: {
    lETH: {
      updatedAt: bigint | null;
      isStale: boolean | null;
    };
    lUSDC: {
      updatedAt: bigint | null;
      isStale: boolean | null;
    };
  };
  health: {
    lETH: {
      healthy: boolean | null;
      reason: string | null;
    };
    lUSDC: {
      healthy: boolean | null;
      reason: string | null;
    };
  };
  emergency: {
    lETH: {
      useEmergency: boolean | null;
      emergencyPrice: bigint | null;
    };
    lUSDC: {
      useEmergency: boolean | null;
      emergencyPrice: bigint | null;
    };
  };
  constants: {
    minPrice: bigint | null;
    maxPrice: bigint | null;
    maxPriceAge: bigint | null;
    ethMaxAge: bigint | null;
    usdcMaxAge: bigint | null;
    assetTypes: {
      lETH: number | null; // 0 = VOLATILE, 1 = STABLECOIN
      lUSDC: number | null;
    };
  };
  isLoading: boolean;
  errors: any[];
}

export function useChainlinkOracle(): ChainlinkOracleData {
  const { data, isLoading } = useReadContracts({
    contracts: [
      // Basic price queries
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getUnderlyingPrice',
        args: [contracts.lETH.address],
      },
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getUnderlyingPrice',
        args: [contracts.lUSDC.address],
      },
      // Price metadata
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getPriceWithMetadata',
        args: [contracts.lETH.address],
      },
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getPriceWithMetadata',
        args: [contracts.lUSDC.address],
      },
      // Health checks
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'checkPriceFeedHealth',
        args: [contracts.lETH.address],
      },
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'checkPriceFeedHealth',
        args: [contracts.lUSDC.address],
      },
      // Emergency status
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'useEmergencyPrice',
        args: [contracts.lETH.address],
      },
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'useEmergencyPrice',
        args: [contracts.lUSDC.address],
      },
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'emergencyPrices',
        args: [contracts.lETH.address],
      },
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'emergencyPrices',
        args: [contracts.lUSDC.address],
      },
      // Oracle constants
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'MIN_PRICE',
      },
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'MAX_PRICE',
      },
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'MAX_PRICE_AGE',
      },
      // Asset-specific max ages (V2 oracle features)
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getMaxPriceAge',
        args: [contracts.lETH.address],
      },
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getMaxPriceAge',
        args: [contracts.lUSDC.address],
      },
      // Asset types
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'assetTypes',
        args: [contracts.lETH.address],
      },
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'assetTypes',
        args: [contracts.lUSDC.address],
      },
    ],
  });

  // Parse the results
  const result: ChainlinkOracleData = {
    prices: {
      lETH: data?.[0]?.status === 'success' ? (data[0].result as bigint) : null,
      lUSDC: data?.[1]?.status === 'success' ? (data[1].result as bigint) : null,
    },
    metadata: {
      lETH: {
        updatedAt: data?.[2]?.status === 'success' ? (data[2].result as readonly [bigint, bigint, boolean])?.[1] : null,
        isStale: data?.[2]?.status === 'success' ? (data[2].result as readonly [bigint, bigint, boolean])?.[2] : null,
      },
      lUSDC: {
        updatedAt: data?.[3]?.status === 'success' ? (data[3].result as readonly [bigint, bigint, boolean])?.[1] : null,
        isStale: data?.[3]?.status === 'success' ? (data[3].result as readonly [bigint, bigint, boolean])?.[2] : null,
      },
    },
    health: {
      lETH: {
        healthy: data?.[4]?.status === 'success' ? (data[4].result as readonly [boolean, string])?.[0] : null,
        reason: data?.[4]?.status === 'success' ? (data[4].result as readonly [boolean, string])?.[1] : null,
      },
      lUSDC: {
        healthy: data?.[5]?.status === 'success' ? (data[5].result as readonly [boolean, string])?.[0] : null,
        reason: data?.[5]?.status === 'success' ? (data[5].result as readonly [boolean, string])?.[1] : null,
      },
    },
    emergency: {
      lETH: {
        useEmergency: data?.[6]?.status === 'success' ? (data[6].result as boolean) : null,
        emergencyPrice: data?.[8]?.status === 'success' ? (data[8].result as bigint) : null,
      },
      lUSDC: {
        useEmergency: data?.[7]?.status === 'success' ? (data[7].result as boolean) : null,
        emergencyPrice: data?.[9]?.status === 'success' ? (data[9].result as bigint) : null,
      },
    },
    constants: {
      minPrice: data?.[10]?.status === 'success' ? (data[10].result as bigint) : null,
      maxPrice: data?.[11]?.status === 'success' ? (data[11].result as bigint) : null,
      maxPriceAge: data?.[12]?.status === 'success' ? (data[12].result as bigint) : null,
      ethMaxAge: data?.[13]?.status === 'success' ? (data[13].result as bigint) : null,
      usdcMaxAge: data?.[14]?.status === 'success' ? (data[14].result as bigint) : null,
      assetTypes: {
        lETH: data?.[15]?.status === 'success' ? (data[15].result as number) : null,
        lUSDC: data?.[16]?.status === 'success' ? (data[16].result as number) : null,
      },
    },
    isLoading,
    errors: data?.filter(d => d.status === 'failure').map(d => d.error) || [],
  };

  // Enhanced logging
  console.log('ChainlinkOracle Data:', {
    oracleAddress: contracts.chainlinkPriceOracle.address,
    prices: {
      ETH: result.prices.lETH ? `$${(Number(result.prices.lETH) / 1e18).toFixed(2)}` : 'N/A',
      USDC: result.prices.lUSDC ? `$${(Number(result.prices.lUSDC) / 1e18).toFixed(2)}` : 'N/A',
    },
    health: {
      ETH: result.health.lETH.healthy ? '✅ Healthy' : `❌ ${result.health.lETH.reason}`,
      USDC: result.health.lUSDC.healthy ? '✅ Healthy' : `❌ ${result.health.lUSDC.reason}`,
    },
    emergency: {
      ETH: result.emergency.lETH.useEmergency ? '⚠️ Emergency Mode' : '✅ Normal',
      USDC: result.emergency.lUSDC.useEmergency ? '⚠️ Emergency Mode' : '✅ Normal',
    },
    staleness: {
      ETH: result.metadata.lETH.isStale ? '⚠️ Stale' : '✅ Fresh',
      USDC: result.metadata.lUSDC.isStale ? '⚠️ Stale' : '✅ Fresh',
    },
    constants: {
      defaultMaxAge: result.constants.maxPriceAge ? `${Number(result.constants.maxPriceAge)}s` : 'N/A',
      ethMaxAge: result.constants.ethMaxAge ? `${Number(result.constants.ethMaxAge)}s` : 'N/A',
      usdcMaxAge: result.constants.usdcMaxAge ? `${Number(result.constants.usdcMaxAge)}s` : 'N/A',
      assetTypes: {
        ETH: result.constants.assetTypes.lETH === 0 ? 'VOLATILE' : result.constants.assetTypes.lETH === 1 ? 'STABLECOIN' : 'N/A',
        USDC: result.constants.assetTypes.lUSDC === 0 ? 'VOLATILE' : result.constants.assetTypes.lUSDC === 1 ? 'STABLECOIN' : 'N/A',
      },
    },
    errors: result.errors.length > 0 ? result.errors : 'None',
  });

  return result;
}

// Backward compatibility hook for existing components
export function useOraclePrices() {
  const chainlinkData = useChainlinkOracle();
  
  const prices = {
    lETHPrice: chainlinkData.prices.lETH,
    lUSDCPrice: chainlinkData.prices.lUSDC,
    errors: {
      lETH: chainlinkData.errors.find(e => e.toString().includes('lETH')) || null,
      lUSDC: chainlinkData.errors.find(e => e.toString().includes('lUSDC')) || null,
    }
  };

  console.log('Oracle Prices (Legacy Format):', {
    oracleAddress: contracts.chainlinkPriceOracle.address,
    lETHAddress: contracts.lETH.address,
    lUSDCAddress: contracts.lUSDC.address,
    prices: {
      lETHPrice: prices.lETHPrice?.toString(),
      lUSDCPrice: prices.lUSDCPrice?.toString(),
      hasLETHPrice: !!prices.lETHPrice && prices.lETHPrice > 0n,
      hasLUSDCPrice: !!prices.lUSDCPrice && prices.lUSDCPrice > 0n,
    },
    errors: prices.errors,
    summary: {
      lETHPriceSet: !!prices.lETHPrice && prices.lETHPrice > 0n,
      lUSDCPriceSet: !!prices.lUSDCPrice && prices.lUSDCPrice > 0n,
      issue: (!prices.lETHPrice || prices.lETHPrice === 0n) ? 'lETH price not set in oracle' : 
             (!prices.lUSDCPrice || prices.lUSDCPrice === 0n) ? 'lUSDC price not set in oracle' : 
             'Prices look OK'
    }
  });

  return { 
    prices, 
    isLoading: chainlinkData.isLoading,
    // Expose the enhanced data for components that want it
    chainlinkData 
  };
}