// src/hooks/useOraclePrices.ts
import { useReadContracts } from 'wagmi';
import { contracts } from '@/config/contracts';

export function useOraclePrices() {
  const { data, isLoading } = useReadContracts({
    contracts: [
      // Get price for lETH
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getUnderlyingPrice',
        args: [contracts.lETH.address],
      },
      // Get price for lUSDC
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getUnderlyingPrice',
        args: [contracts.lUSDC.address],
      },
      // Get price for lWBTC
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getUnderlyingPrice',
        args: [contracts.lWBTC.address],
      },
      // Get price for lLINK
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getUnderlyingPrice',
        args: [contracts.lLINK.address],
      },
      // Get price for lUSDT
      {
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'getUnderlyingPrice',
        args: [contracts.lUSDT.address],
      },
    ],
  });

  const prices = data ? {
    lETHPrice: data[0]?.status === 'success' ? data[0].result as bigint : null,
    lUSDCPrice: data[1]?.status === 'success' ? data[1].result as bigint : null,
    lWBTCPrice: data[2]?.status === 'success' ? data[2].result as bigint : null,
    lLINKPrice: data[3]?.status === 'success' ? data[3].result as bigint : null,
    lUSDTPrice: data[4]?.status === 'success' ? data[4].result as bigint : null,
    errors: {
      lETH: data[0]?.status === 'failure' ? data[0].error : null,
      lUSDC: data[1]?.status === 'failure' ? data[1].error : null,
      lWBTC: data[2]?.status === 'failure' ? data[2].error : null,
      lLINK: data[3]?.status === 'failure' ? data[3].error : null,
      lUSDT: data[4]?.status === 'failure' ? data[4].error : null,
    }
  } : null;

  console.log('Chainlink Oracle Prices Check:', {
    oracleAddress: contracts.chainlinkPriceOracle.address,
    lETHAddress: contracts.lETH.address,
    lUSDCAddress: contracts.lUSDC.address,
    lWBTCAddress: contracts.lWBTC.address,
    lLINKAddress: contracts.lLINK.address,
    lUSDTAddress: contracts.lUSDT.address,
    prices: prices ? {
      lETHPrice: prices.lETHPrice?.toString(),
      lUSDCPrice: prices.lUSDCPrice?.toString(),
      lWBTCPrice: prices.lWBTCPrice?.toString(),
      lLINKPrice: prices.lLINKPrice?.toString(),
      lUSDTPrice: prices.lUSDTPrice?.toString(),
      hasLETHPrice: !!prices.lETHPrice && prices.lETHPrice > 0n,
      hasLUSDCPrice: !!prices.lUSDCPrice && prices.lUSDCPrice > 0n,
      hasLWBTCPrice: !!prices.lWBTCPrice && prices.lWBTCPrice > 0n,
      hasLLINKPrice: !!prices.lLINKPrice && prices.lLINKPrice > 0n,
      hasLUSDTPrice: !!prices.lUSDTPrice && prices.lUSDTPrice > 0n,
    } : 'loading',
    errors: prices?.errors,
    summary: prices ? {
      lETHPriceSet: !!prices.lETHPrice && prices.lETHPrice > 0n,
      lUSDCPriceSet: !!prices.lUSDCPrice && prices.lUSDCPrice > 0n,
      lWBTCPriceSet: !!prices.lWBTCPrice && prices.lWBTCPrice > 0n,
      lLINKPriceSet: !!prices.lLINKPrice && prices.lLINKPrice > 0n,
      lUSDTPriceSet: !!prices.lUSDTPrice && prices.lUSDTPrice > 0n,
      issue: (!prices.lETHPrice || prices.lETHPrice === 0n) ? 'lETH price not set in oracle' : 
             (!prices.lUSDCPrice || prices.lUSDCPrice === 0n) ? 'lUSDC price not set in oracle' : 
             (!prices.lWBTCPrice || prices.lWBTCPrice === 0n) ? 'lWBTC price not set in oracle' : 
             (!prices.lLINKPrice || prices.lLINKPrice === 0n) ? 'lLINK price not set in oracle' : 
             (!prices.lUSDTPrice || prices.lUSDTPrice === 0n) ? 'lUSDT price not set in oracle' : 
             'All prices look OK'
    } : 'loading'
  });

  return { prices, isLoading };
}