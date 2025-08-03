// src/hooks/useProtocolDiagnostics.ts
import { useAccount, useReadContracts } from 'wagmi';
import { contracts } from '@/config/contracts';

export function useProtocolDiagnostics() {
  const { address } = useAccount();

  const { data, isLoading } = useReadContracts({
    contracts: [
      // Check if oracle is set
      {
        ...contracts.comptroller,
        functionName: 'oracle',
      },
      // Check if lETH market is listed
      {
        ...contracts.comptroller,
        functionName: 'markets',
        args: [contracts.lETH.address],
      },
      // Check if lUSDC market is listed
      {
        ...contracts.comptroller,
        functionName: 'markets',
        args: [contracts.lUSDC.address],
      },
      // Get user's account liquidity
      {
        ...contracts.comptroller,
        functionName: 'getAccountLiquidity',
        args: [address!],
      },
    ],
    query: {
      enabled: !!address,
    },
  });

  const diagnostics = data ? {
    oracleAddress: data[0]?.status === 'success' ? data[0].result as string : null,
    isLETHListed: data[1]?.status === 'success' ? data[1].result as boolean : false,
    isLUSDCListed: data[2]?.status === 'success' ? data[2].result as boolean : false,
    accountLiquidity: data[3]?.status === 'success' ? data[3].result as [bigint, bigint] : null,
  } : null;

  console.log('Protocol Diagnostics DETAILED:', {
    diagnostics: diagnostics ? {
      oracleAddress: diagnostics.oracleAddress,
      oracleAddressIsZero: diagnostics.oracleAddress === '0x0000000000000000000000000000000000000000',
      isLETHListed: diagnostics.isLETHListed,
      isLUSDCListed: diagnostics.isLUSDCListed,
      accountLiquidity: diagnostics.accountLiquidity ? {
        liquidity: diagnostics.accountLiquidity[0].toString(),
        shortfall: diagnostics.accountLiquidity[1].toString(),
        hasLiquidity: diagnostics.accountLiquidity[0] > BigInt(0)
      } : null
    } : 'loading',
    contractAddresses: {
      comptroller: contracts.comptroller.address,
      lETH: contracts.lETH.address,
      lUSDC: contracts.lUSDC.address,
    },
    criticalIssues: diagnostics ? {
      noOracle: !diagnostics.oracleAddress || diagnostics.oracleAddress === '0x0000000000000000000000000000000000000000',
      lETHNotListed: !diagnostics.isLETHListed,
      lUSDCNotListed: !diagnostics.isLUSDCListed,
      noLiquidity: diagnostics.accountLiquidity ? diagnostics.accountLiquidity[0] === BigInt(0) : true,
    } : 'loading'
  });

  return {
    diagnostics,
    isLoading,
  };
}