import { useAccount, useReadContract } from 'wagmi';
import { contracts } from '@/config/contracts';
import { parseUnits } from 'viem';

export function useBorrowValidation(market: string, amount: string) {
  const { address } = useAccount();
  
  const lTokenContract = market === 'lUSDC' ? contracts.lUSDC : contracts.lETH;
  const amountWei = amount ? parseUnits(amount, market === 'lUSDC' ? 6 : 18) : BigInt(0);

  // Test borrowAllowed function from comptroller
  const { data: borrowAllowed, error: borrowAllowedError } = useReadContract({
    address: contracts.comptroller.address,
    abi: contracts.comptroller.abi,
    functionName: 'borrowAllowed',
    args: [lTokenContract.address, address!, amountWei],
    query: { 
      enabled: !!address && !!amount && amountWei > 0,
    }
  });

  // Check available cash in the market
  const { data: availableCash } = useReadContract({
    address: lTokenContract.address,
    abi: lTokenContract.abi,
    functionName: 'getCash',
    query: { enabled: true }
  });

  // Check user's existing borrow balance
  const { data: existingBorrowBalance } = useReadContract({
    address: lTokenContract.address,
    abi: lTokenContract.abi,
    functionName: 'borrowBalanceStored',
    args: [address!],
    query: { enabled: !!address }
  });

  console.log('Borrow Validation:', {
    market,
    amount,
    amountWei: amountWei.toString(),
    borrowAllowed: borrowAllowed?.toString(),
    borrowAllowedError: borrowAllowedError?.message,
    availableCash: availableCash?.toString(),
    existingBorrowBalance: existingBorrowBalance?.toString(),
    validation: {
      comptrollerApproval: borrowAllowed === BigInt(0) ? 'APPROVED' : `REJECTED (code: ${borrowAllowed})`,
      sufficientCash: availableCash && amountWei <= availableCash ? 'YES' : 'NO',
      cashAvailable: availableCash ? `${availableCash.toString()} wei` : 'unknown'
    },
    errorCodes: {
      0: 'Success',
      1: 'Not in market',
      2: 'Insufficient liquidity',
      3: 'Price error',
      4: 'Market not listed'
    }
  });

  return {
    borrowAllowed,
    borrowAllowedError,
    availableCash,
    existingBorrowBalance,
    isValid: borrowAllowed === BigInt(0) && availableCash && amountWei <= availableCash,
    errorCode: borrowAllowed,
  };
}