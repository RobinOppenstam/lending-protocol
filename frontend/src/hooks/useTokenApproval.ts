// src/hooks/useTokenApproval.ts
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { contracts } from '@/config/contracts';

interface UseTokenApprovalProps {
  tokenAddress: `0x${string}`;
  spenderAddress: `0x${string}`;
  amount?: string;
  decimals: number;
}

export function useTokenApproval({ 
  tokenAddress, 
  spenderAddress, 
  amount, 
  decimals 
}: UseTokenApprovalProps) {
  const { address } = useAccount();
  
  // Get the correct token contract
  const isUSDC = tokenAddress === contracts.usdc.address;
  const tokenContract = isUSDC ? contracts.usdc : contracts.weth;

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: tokenContract.abi,
    functionName: 'allowance',
    args: [address!, spenderAddress],
    query: {
      enabled: !!address,
    },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check if approval is needed
  const needsApproval = amount && allowance !== undefined ? 
    allowance < parseUnits(amount, decimals) : false;

  const approve = async (approvalAmount?: string) => {
    try {
      // Use max approval for better UX (user won't need to approve again)
      const amountToApprove = approvalAmount ? 
        parseUnits(approvalAmount, decimals) : 
        maxUint256;

      console.log('Approving token:', {
        token: isUSDC ? 'USDC' : 'WETH',
        spender: spenderAddress,
        amount: approvalAmount || 'max',
      });

      writeContract({
        address: tokenAddress,
        abi: tokenContract.abi,
        functionName: 'approve',
        args: [spenderAddress, amountToApprove],
        gas: BigInt(100000), // Standard gas for approvals
      });
    } catch (error) {
      console.error('Approval error:', error);
      throw error;
    }
  };

  return {
    allowance,
    needsApproval,
    approve,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    refetchAllowance,
  };
}