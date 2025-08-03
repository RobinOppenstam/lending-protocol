// src/hooks/useTransactionManager.ts
import { useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { contracts } from '@/config/contracts';
import { Market } from '@/types/defi';
import { useLendingActions } from './useLendingActions';

type TransactionStep = 'idle' | 'approval' | 'main' | 'complete' | 'error';

interface TransactionState {
  step: TransactionStep;
  message: string;
  hash?: `0x${string}`;
  error?: string;
}

export function useTransactionManager() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [state, setState] = useState<TransactionState>({
    step: 'idle',
    message: '',
  });

  const lendingActions = useLendingActions();

  const checkAndExecuteApproval = useCallback(async (
    market: Market, 
    amount: string
  ): Promise<boolean> => {
    if (!address || !publicClient) return false;

    try {
      const underlyingAddress = market.underlyingAddress;
      const spenderAddress = market.lTokenAddress;
      const tokenContract = market.symbol === 'lUSDC' ? contracts.usdc : contracts.weth;
      
      // Check current allowance
      const allowance = await publicClient.readContract({
        address: underlyingAddress,
        abi: tokenContract.abi,
        functionName: 'allowance',
        args: [address, spenderAddress],
      }) as bigint;

      const amountWei = parseUnits(amount, market.decimals);
      const needsApproval = allowance < amountWei;

      if (needsApproval) {
        setState({ step: 'approval', message: 'Please approve token spending...' });
        
        // Call the approve function from lendingActions
        lendingActions.approve(underlyingAddress, spenderAddress, amount);
        
        // Return false to indicate approval is in progress
        return false;
      }

      return true; // Approval not needed or already sufficient
    } catch (error) {
      console.error('Approval check error:', error);
      throw error;
    }
  }, [address, publicClient, lendingActions]);

  const executeSupply = useCallback(async (market: Market, amount: string) => {
    if (!address) {
      setState({ step: 'error', message: 'Wallet not connected', error: 'No wallet' });
      return;
    }

    try {
      setState({ step: 'approval', message: 'Checking token approval...' });

      // Check if approval is needed
      const hasApproval = await checkAndExecuteApproval(market, amount);
      
      if (!hasApproval) {
        // Approval transaction initiated, wait for user to complete it
        return;
      }

      setState({ step: 'main', message: 'Supplying tokens...' });
      
      // Execute supply
      lendingActions.supply(market, amount);

    } catch (error: any) {
      console.error('Supply error:', error);
      setState({ 
        step: 'error', 
        message: 'Transaction failed',
        error: error.message || 'Unknown error',
      });
    }
  }, [address, checkAndExecuteApproval, lendingActions]);

  const executeBorrow = useCallback((market: Market, amount: string) => {
    if (!address) {
      setState({ step: 'error', message: 'Wallet not connected', error: 'No wallet' });
      return;
    }

    try {
      setState({ step: 'main', message: 'Borrowing tokens...' });
      
      // No approval needed for borrowing
      lendingActions.borrow(market, amount);

    } catch (error: any) {
      console.error('Borrow error:', error);
      setState({ 
        step: 'error', 
        message: 'Borrow failed',
        error: error.message || 'Unknown error',
      });
    }
  }, [address, lendingActions]);

  const executeRepay = useCallback(async (market: Market, amount: string) => {
    if (!address) {
      setState({ step: 'error', message: 'Wallet not connected', error: 'No wallet' });
      return;
    }

    try {
      setState({ step: 'approval', message: 'Checking token approval...' });
      
      // Check if approval is needed
      const hasApproval = await checkAndExecuteApproval(market, amount);
      
      if (!hasApproval) {
        // Approval transaction initiated, wait for user to complete it
        return;
      }

      setState({ step: 'main', message: 'Repaying loan...' });
      
      lendingActions.repay(market, amount);

    } catch (error: any) {
      console.error('Repay error:', error);
      setState({ 
        step: 'error', 
        message: 'Repay failed',
        error: error.message || 'Unknown error',
      });
    }
  }, [address, checkAndExecuteApproval, lendingActions]);

  const executeWithdraw = useCallback((market: Market, amount: string) => {
    if (!address) {
      setState({ step: 'error', message: 'Wallet not connected', error: 'No wallet' });
      return;
    }

    try {
      setState({ step: 'main', message: 'Withdrawing tokens...' });
      
      // No approval needed for withdrawing
      lendingActions.withdraw(market, amount);

    } catch (error: any) {
      console.error('Withdraw error:', error);
      setState({ 
        step: 'error', 
        message: 'Withdraw failed',
        error: error.message || 'Unknown error',
      });
    }
  }, [address, lendingActions]);

  // Update state based on lendingActions status
  const updateStateFromTransaction = useCallback(() => {
    if (lendingActions.isPending) {
      if (state.step === 'idle' || state.step === 'approval') {
        setState(prev => ({ ...prev, step: 'main', message: 'Transaction pending...' }));
      }
    } else if (lendingActions.isSuccess) {
      setState({ 
        step: 'complete', 
        message: 'Transaction successful!',
        hash: lendingActions.hash,
      });
    } else if (lendingActions.isError) {
      setState({ 
        step: 'error', 
        message: 'Transaction failed',
        error: lendingActions.error?.message || 'Unknown error',
      });
    }
  }, [lendingActions, state.step]);

  // Call updateStateFromTransaction when transaction state changes
  if (lendingActions.isPending || lendingActions.isSuccess || lendingActions.isError) {
    updateStateFromTransaction();
  }

  const reset = useCallback(() => {
    setState({ step: 'idle', message: '' });
  }, []);

  return {
    state,
    executeSupply,
    executeBorrow,
    executeRepay,
    executeWithdraw,
    reset,
    isLoading: state.step === 'approval' || state.step === 'main',
    isSuccess: state.step === 'complete',
    isError: state.step === 'error',
  };
}