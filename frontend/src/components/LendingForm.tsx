// src/components/LendingForm.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useLendingActions } from '@/hooks/useLendingActions';
import { useProtocolDiagnostics } from '@/hooks/useProtocolDiagnostics';
import { useOraclePrices } from '@/hooks/useOraclePrices';
import { useBorrowValidation } from '@/hooks/useBorrowValidation';
import { ActionType, Market } from '@/types/defi';
import { contracts, markets } from '@/config/contracts';
import { formatTokenAmount, formatUSD, isValidAmount, parseTokenAmount } from '@/lib/utils';
import { formatUnits, parseUnits, maxUint256 } from 'viem';
import Image from 'next/image';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  RefreshCw, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  X
} from 'lucide-react';

interface LendingFormProps {
  selectedAction?: ActionType | null;
  selectedMarket?: Market | null;
  onClose?: () => void;
  onTransactionSuccess?: () => void;
}

type TransactionStep = 'idle' | 'approving' | 'approved' | 'executing' | 'success' | 'error';

export function LendingForm({ selectedAction, selectedMarket, onClose, onTransactionSuccess }: LendingFormProps) {
  const { address } = useAccount();
  
  // Add protocol diagnostics
  const { diagnostics } = useProtocolDiagnostics();
  const { prices: oraclePrices } = useOraclePrices();
  
  const [action, setAction] = useState<ActionType>(selectedAction || 'supply');
  const [market, setMarket] = useState<Market>(selectedMarket || markets[0]);
  const [amount, setAmount] = useState('');
  
  // Add borrow validation for debugging (after market is initialized)
  const borrowValidation = useBorrowValidation(market.symbol, amount);
  
  // Add APY diagnostics to see why rates are 0
  const [transactionStep, setTransactionStep] = useState<TransactionStep>('idle');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [lastTransactionTime, setLastTransactionTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Separate hooks for approval and main transactions
  const { writeContract: writeApproval, data: approvalHash, isPending: isApprovalPending } = useWriteContract();
  const { writeContract: writeMainTx, data: mainTxHash, isPending: isMainTxPending } = useWriteContract();

  // Wait for approval transaction
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Wait for main transaction with extended timeout for withdraw
  const { isLoading: isMainTxConfirming, isSuccess: isMainTxSuccess, error: txError } = useWaitForTransactionReceipt({
    hash: mainTxHash,
    timeout: action === 'withdraw' ? 180000 : 120000, // 3 minutes for withdraw, 2 minutes for others
  });

  // Get user's token balance
  const { data: tokenBalance } = useBalance({
    address,
    token: market.underlyingAddress,
  });
  
  // Get user's ETH balance for gas
  const { data: ethBalance } = useBalance({
    address,
  });

  // Get user's lToken balance for withdraw
  const { data: lTokenBalance } = useReadContract({
    address: market.lTokenAddress,
    abi: market.symbol === 'lUSDC' ? contracts.lUSDC.abi : contracts.lETH.abi,
    functionName: 'accountTokens',
    args: [address!],
    query: { enabled: !!address && (action === 'withdraw') }
  });

  // Get exchange rate for withdraw calculations
  const { data: exchangeRate } = useReadContract({
    address: market.lTokenAddress,
    abi: market.symbol === 'lUSDC' ? contracts.lUSDC.abi : contracts.lETH.abi,
    functionName: 'exchangeRateStored',
    query: { enabled: !!address && (action === 'withdraw') }
  });

  // Get user's borrow balance for repay
  const { data: borrowBalance } = useReadContract({
    address: market.lTokenAddress,
    abi: market.symbol === 'lUSDC' ? contracts.lUSDC.abi : contracts.lETH.abi,
    functionName: 'borrowBalanceStored',
    args: [address!],
    query: { enabled: !!address && (action === 'repay') }
  });

  // Get allowance for approve check - use correct token contract
  const tokenContract = market.underlyingAddress === contracts.usdc.address ? contracts.usdc : contracts.weth;
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: market.underlyingAddress,
    abi: tokenContract.abi,
    functionName: 'allowance',
    args: [address!, market.lTokenAddress],
    query: { enabled: !!address && (action === 'supply' || action === 'repay') }
  });

  // Check if user is in market (for borrowing)
  const { data: isInMarket } = useReadContract({
    address: contracts.comptroller.address,
    abi: contracts.comptroller.abi,
    functionName: 'accountMembership',
    args: [address!, market.lTokenAddress],
    query: { enabled: !!address && action === 'borrow' }
  });

  // Update form when props change
  useEffect(() => {
    if (selectedAction) setAction(selectedAction);
    if (selectedMarket) setMarket(selectedMarket);
  }, [selectedAction, selectedMarket]);

  // Handle approval success
  useEffect(() => {
    if (isApprovalSuccess && transactionStep === 'approving') {
      setTransactionStep('approved');
      refetchAllowance();
    }
  }, [isApprovalSuccess, transactionStep, refetchAllowance]);

  // Handle main transaction success
  useEffect(() => {
    if (isMainTxSuccess && transactionStep === 'executing') {
      setTransactionStep('success');
      setTransactionHash(mainTxHash || '');
      setAmount('');
      setRetryCount(0); // Reset retry count on success
      
      console.log('Transaction completed successfully:', {
        action,
        market: market.symbol,
        amount,
        hash: mainTxHash,
        timestamp: new Date().toISOString(),
        isRepayTransaction: action === 'repay',
        currentBorrowBalance: action === 'repay' ? borrowBalance?.toString() : 'N/A'
      });
      
      // Trigger refresh of user position data
      if (onTransactionSuccess) {
        console.log('Triggering data refresh after transaction success...', {
          action,
          delaySeconds: 5,
          shouldDecreaseBorrow: action === 'repay',
          shouldDecreaseSupply: action === 'withdraw'
        });
        setTimeout(() => {
          console.log('Executing data refresh now...', {
            action,
            timestamp: new Date().toISOString(),
            note: action === 'repay' ? 'Expected: borrow balance should decrease, supply should stay same' : 'N/A'
          });
          onTransactionSuccess();
        }, 5000); // Wait 5 seconds for blockchain confirmation
      }
    }
  }, [isMainTxSuccess, transactionStep, mainTxHash, onTransactionSuccess]);

  // Handle transaction errors
  useEffect(() => {
    if (txError && transactionStep === 'executing') {
      console.error('Transaction failed with error:', {
        error: txError,
        message: txError?.message,
        details: (txError as any)?.details || (txError as any)?.cause,
        hash: mainTxHash,
        action,
        market: market.symbol,
        amount
      });
      setTransactionStep('error');
    }
  }, [txError, transactionStep, mainTxHash, action, market.symbol, amount]);

  const getMaxAmount = () => {
    switch (action) {
      case 'supply':
      case 'repay':
        return tokenBalance ? formatUnits(tokenBalance.value, tokenBalance.decimals) : '0';
      case 'withdraw':
        // Convert lToken balance to underlying amount for display
        if (lTokenBalance && exchangeRate) {
          const lTokenBal = lTokenBalance as bigint;
          const exchRate = exchangeRate as bigint;
          const underlyingAmount = (lTokenBal * exchRate) / BigInt(1e18);
          return formatUnits(underlyingAmount, market.decimals);
        }
        return '0';
      case 'borrow':
        // Calculate max borrow based on account liquidity
        if (diagnostics?.accountLiquidity) {
          const availableLiquidity = diagnostics.accountLiquidity[0];
          // Convert from 18 decimals to token decimals, assuming $1 price for simplicity
          const maxBorrowWei = availableLiquidity;
          const maxBorrowFormatted = formatUnits(maxBorrowWei, 18);
          console.log('Max borrow calculation:', {
            availableLiquidity: availableLiquidity.toString(),
            maxBorrowFormatted,
            market: market.symbol
          });
          return maxBorrowFormatted;
        }
        return '0'; // No liquidity available
      default:
        return '0';
    }
  };

  const needsApproval = () => {
    if (!amount || (action !== 'supply' && action !== 'repay')) return false;
    
    try {
      const amountWei = parseUnits(amount, market.decimals);
      const currentAllowance = allowance || BigInt(0);
      
      console.log('Checking approval need:', {
        action,
        market: market.symbol,
        token: market.underlyingSymbol,
        amount,
        amountWei: amountWei.toString(),
        currentAllowance: currentAllowance.toString(),
        needsApproval: amountWei > currentAllowance,
        hasAllowanceData: allowance !== undefined
      });
      
      return amountWei > currentAllowance;
    } catch (err) {
      console.error('Error checking approval:', err);
      return false;
    }
  };

  const handleMaxClick = () => {
    setAmount(getMaxAmount());
  };

  const handleApprove = async () => {
    if (!amount || !address) return;
    
    try {
      setTransactionStep('approving');
      
      console.log('Starting approval:', {
        token: market.underlyingSymbol,
        tokenAddress: market.underlyingAddress,
        spender: market.lTokenAddress,
        amount: 'MAX',
        user: address
      });
      
      // Use max approval for better UX
      writeApproval({
        address: market.underlyingAddress,
        abi: tokenContract.abi,
        functionName: 'approve',
        args: [market.lTokenAddress, maxUint256],
        gas: BigInt(150000), // Increased gas limit for approvals
      });
    } catch (err: any) {
      console.error('Approval failed:', {
        error: err,
        message: err?.message,
        code: err?.code,
        token: market.underlyingSymbol,
        tokenAddress: market.underlyingAddress,
        spender: market.lTokenAddress
      });
      setTransactionStep('error');
    }
  };

  const handleEnterMarket = async () => {
    try {
      console.log('Entering market:', {
        market: market.symbol,
        lTokenAddress: market.lTokenAddress,
        comptrollerAddress: contracts.comptroller.address,
        user: address,
        currentMarketMembership: isInMarket
      });
      
      writeMainTx({
        address: contracts.comptroller.address,
        abi: contracts.comptroller.abi,
        functionName: 'enterMarkets',
        args: [[market.lTokenAddress]],
        gas: BigInt(200000),
      });
    } catch (err) {
      console.error('Enter market failed:', err);
      setTransactionStep('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !isValidAmount(amount) || !address) return;
    
    // Prevent rapid consecutive transactions (5 second cooldown)
    const now = Date.now();
    if (now - lastTransactionTime < 5000) {
      console.warn('Transaction cooldown active, please wait...');
      return;
    }
    
    // Double-check approval before submitting
    if ((action === 'supply' || action === 'repay') && needsApproval()) {
      console.error('Cannot submit: approval needed first');
      setTransactionStep('error');
      return;
    }

    try {
      setTransactionStep('executing');
      setLastTransactionTime(now); // Set cooldown timestamp
      
      const amountWei = parseUnits(amount, market.decimals);
      const lTokenContract = market.symbol === 'lUSDC' ? contracts.lUSDC : contracts.lETH;

      // Execute the action
      switch (action) {
        case 'supply':
          console.log('Starting supply transaction:', {
            market: market.symbol,
            lTokenAddress: market.lTokenAddress,
            underlyingAddress: market.underlyingAddress,
            underlyingSymbol: market.underlyingSymbol,
            amount: amount,
            amountWei: amountWei.toString(),
            user: address,
            expectedLTokensFromABI: 'should call supply(uint256) and mint lTokens to accountTokens[user]'
          });
          
          writeMainTx({
            address: market.lTokenAddress,
            abi: lTokenContract.abi,
            functionName: 'supply',
            args: [amountWei],
            gas: BigInt(750000), // Increased gas limit
          });
          break;
          
        case 'borrow':
          console.log('Starting borrow transaction:', {
            market: market.symbol,
            lTokenAddress: market.lTokenAddress,
            underlyingAddress: market.underlyingAddress,
            underlyingSymbol: market.underlyingSymbol,
            amount: amount,
            amountWei: amountWei.toString(),
            user: address,
            isInMarket,
            protocolDiagnostics: diagnostics,
            expectedFlow: 'should check comptroller.borrowAllowed() then execute borrow(uint256)'
          });
          
          writeMainTx({
            address: market.lTokenAddress,
            abi: lTokenContract.abi,
            functionName: 'borrow',
            args: [amountWei],
            gas: BigInt(500000),
          });
          break;
          
        case 'repay':
          console.log('Starting repay transaction:', {
            market: market.symbol,
            lTokenAddress: market.lTokenAddress,
            underlyingAddress: market.underlyingAddress,
            underlyingSymbol: market.underlyingSymbol,
            amount: amount,
            amountWei: amountWei.toString(),
            user: address,
            currentBorrowBalance: borrowBalance?.toString(),
            expectedFlow: 'should call repayBorrow(uint256) and reduce borrowBalance[user]'
          });
          
          writeMainTx({
            address: market.lTokenAddress,
            abi: lTokenContract.abi,
            functionName: 'repayBorrow',
            args: [amountWei],
            gas: BigInt(500000),
          });
          break;
          
        case 'withdraw':
          console.log('Starting withdraw transaction:', {
            market: market.symbol,
            lTokenAddress: market.lTokenAddress,
            underlyingAddress: market.underlyingAddress,
            underlyingSymbol: market.underlyingSymbol,
            amount: amount,
            user: address,
            currentLTokenBalance: lTokenBalance?.toString(),
            exchangeRateNeeded: 'Need to convert underlying amount to lTokens',
            expectedFlow: 'should call redeem(uint256 lTokenAmount) to withdraw underlying'
          });
          
          // For withdraw, we need to convert underlying amount to lTokens
          // User enters underlying amount, but contract expects lToken amount
          // lTokenAmount = underlyingAmount / exchangeRate * 1e18
          
          const currentExchangeRate = (exchangeRate as bigint) || BigInt(1e18);
          const underlyingAmountWei = parseUnits(amount, market.decimals);
          const lTokenAmountNeeded = (underlyingAmountWei * BigInt(1e18)) / currentExchangeRate;
          
          console.log('Withdraw calculation details:', {
            underlyingAmount: amount,
            underlyingAmountWei: underlyingAmountWei.toString(),
            currentExchangeRate: currentExchangeRate.toString(),
            lTokenAmountNeeded: lTokenAmountNeeded.toString(),
            currentLTokenBalance: lTokenBalance?.toString(),
            hasEnoughLTokens: lTokenBalance ? lTokenAmountNeeded <= lTokenBalance : 'unknown'
          });
          
          // Add validation before transaction
          if (!lTokenBalance || lTokenAmountNeeded > (lTokenBalance as bigint)) {
            console.error('Insufficient lToken balance for withdrawal:', {
              requested: lTokenAmountNeeded.toString(),
              available: lTokenBalance?.toString() || '0'
            });
            setTransactionStep('error');
            return;
          }

          writeMainTx({
            address: market.lTokenAddress,
            abi: lTokenContract.abi,
            functionName: 'redeem',
            args: [lTokenAmountNeeded],
            gas: BigInt(750000), // Increased gas for withdraw
            // Add some additional gas buffer for complex calculations
            gasPrice: undefined, // Let wagmi handle gas price
          });
          break;
      }
    } catch (err: any) {
      console.error('Transaction failed:', {
        error: err,
        message: err?.message,
        code: err?.code,
        action: action,
        market: market.symbol,
        amount: amount
      });
      setTransactionStep('error');
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case 'supply':
        return <ArrowUpCircle className="w-5 h-5" />;
      case 'borrow':
        return <ArrowDownCircle className="w-5 h-5" />;
      case 'repay':
        return <RefreshCw className="w-5 h-5" />;
      case 'withdraw':
        return <DollarSign className="w-5 h-5" />;
    }
  };


  const isLoading = isApprovalPending || isApprovalConfirming || isMainTxPending || isMainTxConfirming;
  const needsApprovalCheck = needsApproval();
  const showApprovalButton = needsApprovalCheck && transactionStep !== 'approved';
  const showEnterMarketButton = action === 'borrow' && !isInMarket && transactionStep === 'idle';
  const canSubmit = amount && isValidAmount(amount) && (!needsApprovalCheck || transactionStep === 'approved') && (!action.includes('borrow') || isInMarket);
  
  // Debug logging
  console.log('Form state:', {
    action,
    market: market.symbol,
    amount,
    needsApprovalCheck,
    showApprovalButton,
    showEnterMarketButton,
    canSubmit,
    transactionStep,
    allowance: allowance?.toString(),
    isInMarket,
    isLoading,
    borrowingRequirements: {
      hasAmount: !!amount,
      isValidAmount: amount ? isValidAmount(amount) : false,
      isInMarket: isInMarket,
      needsMarketEntry: action === 'borrow' && !isInMarket
    },
    // Show why borrow might fail
    borrowBlockers: action === 'borrow' ? {
      noAmount: !amount,
      invalidAmount: amount && !isValidAmount(amount),
      notInMarket: !isInMarket,
      noOracle: diagnostics ? (!diagnostics.oracleAddress || diagnostics.oracleAddress === '0x0000000000000000000000000000000000000000') : 'unknown',
      marketNotListed: diagnostics ? !diagnostics.isLETHListed && market.symbol === 'lETH' : 'unknown',
      noLiquidity: diagnostics?.accountLiquidity ? diagnostics.accountLiquidity[0] === BigInt(0) : 'unknown'
    } : null
  });

  return (
    <div className="bg-card rounded-xl p-6 card-shadow sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {getActionIcon()}
          <h3 className="text-lg font-semibold text-card-foreground capitalize">
            {action} {market.underlyingSymbol}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Action Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Action
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['supply', 'borrow', 'repay', 'withdraw'] as ActionType[]).map((actionType) => (
              <button
                key={actionType}
                type="button"
                onClick={() => {
                  setAction(actionType);
                  setTransactionStep('idle');
                  setAmount('');
                }}
                className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                  action === actionType
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-600 text-muted-foreground hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {actionType === 'supply' && <ArrowUpCircle className="w-4 h-4" />}
                  {actionType === 'borrow' && <ArrowDownCircle className="w-4 h-4" />}
                  {actionType === 'repay' && <RefreshCw className="w-4 h-4" />}
                  {actionType === 'withdraw' && <DollarSign className="w-4 h-4" />}
                  <span className="capitalize">{actionType}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Market Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Asset
          </label>
          <div className="grid grid-cols-1 gap-2">
            {markets.map((marketOption) => (
              <button
                key={marketOption.symbol}
                type="button"
                onClick={() => {
                  setMarket(marketOption);
                  setTransactionStep('idle');
                  setAmount('');
                }}
                className={`p-3 text-left rounded-lg border transition-colors ${
                  market.symbol === marketOption.symbol
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Image 
                    src={marketOption.icon} 
                    alt={`${marketOption.underlyingSymbol} logo`}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <div className="font-medium text-card-foreground">
                      {marketOption.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {marketOption.underlyingSymbol}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Amount
            </label>
            <div className="text-sm text-muted-foreground">
              Balance: {formatTokenAmount(
                tokenBalance?.value || BigInt(0),
                tokenBalance?.decimals || 18,
                4
              )} {market.underlyingSymbol}
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 pr-20 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleMaxClick}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              MAX
            </button>
          </div>
          {amount && (
            <div className="mt-2 text-sm text-muted-foreground">
              ≈ {formatUSD(parseFloat(amount))} {/* This would use real price data */}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Enter Market Button (for borrowing) */}
          {showEnterMarketButton && (
            <button
              type="button"
              onClick={handleEnterMarket}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isMainTxPending || isMainTxConfirming ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Entering Market...</span>
                </div>
              ) : (
                'Enter Market (Required for Borrowing)'
              )}
            </button>
          )}

          {/* Approval Button */}
          {showApprovalButton && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isLoading || !amount}
              className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {transactionStep === 'approving' || isApprovalPending || isApprovalConfirming ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Approving...</span>
                </div>
              ) : (
                `Approve ${market.underlyingSymbol}`
              )}
            </button>
          )}

          {/* Main Action Button */}
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className={`w-full py-3 px-4 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white ${
              action === 'supply' ? 'bg-green-600 hover:bg-green-700' :
              action === 'borrow' ? 'bg-blue-600 hover:bg-blue-700' :
              action === 'repay' ? 'bg-purple-600 hover:bg-purple-700' :
              action === 'withdraw' ? 'bg-orange-600 hover:bg-orange-700' :
              'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {transactionStep === 'executing' || isMainTxPending || isMainTxConfirming ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              `${action.charAt(0).toUpperCase() + action.slice(1)} ${market.underlyingSymbol}`
            )}
          </button>
        </div>

        {/* Protocol Setup Warnings */}
        {action === 'borrow' && diagnostics && (
          <div className="space-y-3">
            {(!diagnostics.oracleAddress || diagnostics.oracleAddress === '0x0000000000000000000000000000000000000000') && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Price Oracle Not Set
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      The protocol's price oracle is not configured. Borrowing requires price feeds.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {!diagnostics.isLETHListed && market.symbol === 'lETH' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Market Not Listed
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      lETH market is not listed in the comptroller. Contact protocol admin.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {diagnostics.accountLiquidity && diagnostics.accountLiquidity[0] === BigInt(0) && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      No Borrowing Power
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      You need to supply collateral first before you can borrow. Available liquidity: $0
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Oracle Price Status */}
            {oraclePrices && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Oracle Price Status
                    </h4>
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                      <div>lETH Price: {oraclePrices.lETHPrice ? `${oraclePrices.lETHPrice.toString()} wei` : 'Not set'} 
                        {oraclePrices.lETHPrice && oraclePrices.lETHPrice > 0n ? ' ✅' : ' ❌'}</div>
                      <div>lUSDC Price: {oraclePrices.lUSDCPrice ? `${oraclePrices.lUSDCPrice.toString()} wei` : 'Not set'}
                        {oraclePrices.lUSDCPrice && oraclePrices.lUSDCPrice > 0n ? ' ✅' : ' ❌'}</div>
                      {(!oraclePrices.lETHPrice || oraclePrices.lETHPrice === 0n || !oraclePrices.lUSDCPrice || oraclePrices.lUSDCPrice === 0n) && (
                        <div className="text-red-600 dark:text-red-400 font-medium">
                          ⚠️ Missing oracle prices will cause getAccountLiquidity to fail
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Borrow Validation Status */}
            {amount && borrowValidation && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      Borrow Validation
                    </h4>
                    <div className="text-sm text-purple-700 dark:text-purple-300 mt-1 space-y-1">
                      <div>Comptroller Approval: {borrowValidation.errorCode === BigInt(0) ? '✅ Approved' : `❌ Rejected (${borrowValidation.errorCode?.toString()})`}</div>
                      <div>Available Cash: {borrowValidation.availableCash ? `${borrowValidation.availableCash.toString()} wei` : 'Loading...'}</div>
                      <div>Amount Requested: {amount} {market.underlyingSymbol}</div>
                      {borrowValidation.errorCode !== BigInt(0) && (
                        <div className="text-red-600 dark:text-red-400 font-medium">
                          Error Code {borrowValidation.errorCode?.toString()}: {
                            borrowValidation.errorCode === BigInt(1) ? 'Not in market' :
                            borrowValidation.errorCode === BigInt(2) ? 'Insufficient liquidity' :
                            borrowValidation.errorCode === BigInt(3) ? 'Price error' :
                            borrowValidation.errorCode === BigInt(4) ? 'Market not listed' :
                            'Unknown error'
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Low ETH Warning */}
        {ethBalance && ethBalance.value < parseUnits('0.01', 18) && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Low ETH Balance
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  You have {formatUnits(ethBalance.value, 18)} ETH. Make sure you have enough for gas fees.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {transactionStep === 'error' && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Transaction Failed
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Please check the console for more details and try again.
                </p>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => {
                      setTransactionStep('idle');
                      setRetryCount(0);
                    }}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Try Again
                  </button>
                  {action === 'withdraw' && (
                    <span className="text-xs text-red-500">
                      Try reducing the amount or check your lToken balance
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {transactionStep === 'success' && transactionHash && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Transaction Successful
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your {action} transaction has been confirmed.
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 mt-2"
                >
                  <span>View on Etherscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Action Info */}
        <div className="p-4 bg-secondary rounded-lg">
          <h4 className="text-sm font-medium text-card-foreground mb-2">
            Transaction Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Action:</span>
              <span className="text-card-foreground capitalize">{action}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asset:</span>
              <span className="text-card-foreground">{market.underlyingSymbol}</span>
            </div>
            {amount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="text-card-foreground">{amount} {market.underlyingSymbol}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={`text-card-foreground capitalize ${
                transactionStep === 'success' ? 'text-green-600' : 
                transactionStep === 'error' ? 'text-red-600' : ''
              }`}>
                {transactionStep === 'idle' ? 'Ready' : transactionStep}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}