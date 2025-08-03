// src/hooks/useOraclePrices.ts
import { useReadContracts } from 'wagmi';
import { contracts } from '@/config/contracts';

export function useOraclePrices() {
  const { data, isLoading } = useReadContracts({
    contracts: [
      // Get price for lETH
      {
        address: contracts.priceOracle.address,
        abi: contracts.priceOracle.abi,
        functionName: 'getUnderlyingPrice',
        args: [contracts.lETH.address],
      },
      // Get price for lUSDC
      {
        address: contracts.priceOracle.address,
        abi: contracts.priceOracle.abi,
        functionName: 'getUnderlyingPrice',
        args: [contracts.lUSDC.address],
      },
    ],
  });

  const prices = data ? {
    lETHPrice: data[0]?.status === 'success' ? data[0].result as bigint : null,
    lUSDCPrice: data[1]?.status === 'success' ? data[1].result as bigint : null,
    errors: {
      lETH: data[0]?.status === 'failure' ? data[0].error : null,
      lUSDC: data[1]?.status === 'failure' ? data[1].error : null,
    }
  } : null;

  console.log('Oracle Prices Check:', {
    oracleAddress: contracts.priceOracle.address,
    lETHAddress: contracts.lETH.address,
    lUSDCAddress: contracts.lUSDC.address,
    prices: prices ? {
      lETHPrice: prices.lETHPrice?.toString(),
      lUSDCPrice: prices.lUSDCPrice?.toString(),
      hasLETHPrice: !!prices.lETHPrice && prices.lETHPrice > 0n,
      hasLUSDCPrice: !!prices.lUSDCPrice && prices.lUSDCPrice > 0n,
    } : 'loading',
    errors: prices?.errors,
    summary: prices ? {
      lETHPriceSet: !!prices.lETHPrice && prices.lETHPrice > 0n,
      lUSDCPriceSet: !!prices.lUSDCPrice && prices.lUSDCPrice > 0n,
      issue: (!prices.lETHPrice || prices.lETHPrice === 0n) ? 'lETH price not set in oracle' : 
             (!prices.lUSDCPrice || prices.lUSDCPrice === 0n) ? 'lUSDC price not set in oracle' : 
             'Prices look OK'
    } : 'loading'
  });

  return { prices, isLoading };
}