// src/hooks/useLendingActions.ts
import { useWriteContract, useWaitForTransactionReceipt, useEstimateGas, useGasPrice } from 'wagmi';
import { contracts } from '@/config/contracts';
import { parseUnits } from 'viem';
import { Market, UseLendingActionsReturn } from '@/types/defi';

export function useLendingActions(): UseLendingActionsReturn {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { data: gasPrice } = useGasPrice();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    timeout: 120000, // 2 minutes timeout
  });

  // Helper function to get gas configuration
  const getGasConfig = () => {
    if (!gasPrice) return {};
    
    return {
      gasPrice: gasPrice * BigInt(120) / BigInt(100), // 20% buffer
      gas: BigInt(500000), // Conservative gas limit
    };
  };

  const supply = async (market: Market, amount: string) => {
    try {
      const contract = market.symbol === 'lUSDC' ? contracts.lUSDC : contracts.lETH;
      const amountWei = parseUnits(amount, market.decimals);
      
      // First check if we need approval
      console.log('Supplying:', amount, market.symbol);
      
      writeContract({
        address: contract.address,
        abi: contract.abi,
        functionName: 'supply',
        args: [amountWei],
        ...getGasConfig(),
      });
    } catch (err) {
      console.error('Supply transaction error:', err);
      throw err;
    }
  };

  const borrow = async (market: Market, amount: string) => {
    try {
      const contract = market.symbol === 'lUSDC' ? contracts.lUSDC : contracts.lETH;
      const amountWei = parseUnits(amount, market.decimals);
      
      console.log('Borrowing:', amount, market.symbol);
      
      writeContract({
        address: contract.address,
        abi: contract.abi,
        functionName: 'borrow',
        args: [amountWei],
        ...getGasConfig(),
      });
    } catch (err) {
      console.error('Borrow transaction error:', err);
      throw err;
    }
  };

  const repay = async (market: Market, amount: string) => {
    try {
      const contract = market.symbol === 'lUSDC' ? contracts.lUSDC : contracts.lETH;
      const amountWei = parseUnits(amount, market.decimals);
      
      console.log('Repaying:', amount, market.symbol);
      
      writeContract({
        address: contract.address,
        abi: contract.abi,
        functionName: 'repayBorrow',
        args: [amountWei],
        ...getGasConfig(),
      });
    } catch (err) {
      console.error('Repay transaction error:', err);
      throw err;
    }
  };

  const withdraw = async (market: Market, amount: string) => {
    try {
      const contract = market.symbol === 'lUSDC' ? contracts.lUSDC : contracts.lETH;
      const amountWei = parseUnits(amount, 18); // lTokens are always 18 decimals
      
      console.log('Withdrawing:', amount, market.symbol);
      
      writeContract({
        address: contract.address,
        abi: contract.abi,
        functionName: 'redeem',
        args: [amountWei],
        ...getGasConfig(),
      });
    } catch (err) {
      console.error('Withdraw transaction error:', err);
      throw err;
    }
  };

  const approve = async (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: string) => {
    try {
      const isUSDC = tokenAddress === contracts.usdc.address;
      const contract = isUSDC ? contracts.usdc : contracts.weth;
      const decimals = isUSDC ? 6 : 18;
      const amountWei = parseUnits(amount, decimals);
      
      console.log('Approving:', amount, isUSDC ? 'USDC' : 'WETH');
      
      writeContract({
        address: tokenAddress,
        abi: contract.abi,
        functionName: 'approve',
        args: [spender, amountWei],
        ...getGasConfig(),
      });
    } catch (err) {
      console.error('Approve transaction error:', err);
      throw err;
    }
  };

  const enterMarkets = async (marketAddresses: `0x${string}`[]) => {
    try {
      console.log('Entering markets:', marketAddresses);
      
      writeContract({
        address: contracts.comptroller.address,
        abi: contracts.comptroller.abi,
        functionName: 'enterMarkets',
        args: [marketAddresses],
        ...getGasConfig(),
      });
    } catch (err) {
      console.error('Enter markets transaction error:', err);
      throw err;
    }
  };

  return {
    supply,
    borrow,
    repay,
    withdraw,
    approve,
    enterMarkets,
    isPending: isPending || isConfirming,
    isSuccess,
    isError: !!error,
    error: error as Error | null,
    hash,
  };
}