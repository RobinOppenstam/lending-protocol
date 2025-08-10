// src/components/ChainlinkOracleAdmin.tsx
'use client';

import { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { contracts } from '@/config/contracts';
import { useChainlinkOracle } from '@/hooks/useChainlinkOracle';

export function ChainlinkOracleAdmin() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const oracleData = useChainlinkOracle();

  const [emergencyPrice, setEmergencyPrice] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<'lETH' | 'lUSDC'>('lETH');
  const [operationStatus, setOperationStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const clearStatus = () => {
    setTimeout(() => setOperationStatus({ type: null, message: '' }), 3000);
  };

  const handlePausePriceFeed = async () => {
    if (!emergencyPrice || !address) return;
    
    try {
      const priceInWei = parseEther(emergencyPrice);
      const tokenAddress = selectedToken === 'lETH' ? contracts.lETH.address : contracts.lUSDC.address;
      
      await writeContract({
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'pausePriceFeed',
        args: [tokenAddress, priceInWei],
      });
      
      setOperationStatus({
        type: 'success',
        message: `${selectedToken} price feed paused with emergency price $${emergencyPrice}`
      });
      setEmergencyPrice('');
      clearStatus();
    } catch (error: any) {
      setOperationStatus({
        type: 'error',
        message: `Failed to pause price feed: ${error.message}`
      });
      clearStatus();
    }
  };

  const handleResumePriceFeed = async () => {
    if (!address) return;
    
    try {
      const tokenAddress = selectedToken === 'lETH' ? contracts.lETH.address : contracts.lUSDC.address;
      
      await writeContract({
        address: contracts.chainlinkPriceOracle.address,
        abi: contracts.chainlinkPriceOracle.abi,
        functionName: 'resumePriceFeed',
        args: [tokenAddress],
      });
      
      setOperationStatus({
        type: 'success',
        message: `${selectedToken} price feed resumed to normal operation`
      });
      clearStatus();
    } catch (error: any) {
      setOperationStatus({
        type: 'error',
        message: `Failed to resume price feed: ${error.message}`
      });
      clearStatus();
    }
  };

  if (!address) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔧 Oracle Admin Panel
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            Please connect your wallet to access the Oracle Admin panel
          </div>
        </div>
      </div>
    );
  }

  const selectedTokenData = selectedToken === 'lETH' ? oracleData.emergency.lETH : oracleData.emergency.lUSDC;
  const selectedHealthData = selectedToken === 'lETH' ? oracleData.health.lETH : oracleData.health.lUSDC;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          🔧 Oracle Admin Panel
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Emergency Controls
        </div>
      </div>

      {/* Status Message */}
      {operationStatus.type && (
        <div className={`mb-6 p-4 rounded-lg ${
          operationStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' 
            : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
        }`}>
          {operationStatus.message}
        </div>
      )}

      {/* Token Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Token
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedToken('lETH')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedToken === 'lETH'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <img src="/Eth_logo.png" alt="ETH" className="w-5 h-5" />
            lETH
          </button>
          <button
            onClick={() => setSelectedToken('lUSDC')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedToken === 'lUSDC'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <img src="/usdc_logo.png" alt="USDC" className="w-5 h-5" />
            lUSDC
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Current {selectedToken} Status
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Mode: </span>
            <span className={selectedTokenData.useEmergency ? 'text-orange-600' : 'text-green-600'}>
              {selectedTokenData.useEmergency ? 'Emergency' : 'Normal'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Health: </span>
            <span className={selectedHealthData.healthy ? 'text-green-600' : 'text-red-600'}>
              {selectedHealthData.healthy ? 'Healthy' : selectedHealthData.reason}
            </span>
          </div>
        </div>
        {selectedTokenData.useEmergency && selectedTokenData.emergencyPrice && (
          <div className="mt-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Emergency Price: </span>
            <span className="font-mono">
              ${(Number(selectedTokenData.emergencyPrice) / 1e18).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Emergency Controls */}
      <div className="space-y-6">
        {/* Pause Price Feed */}
        <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <h3 className="font-medium text-orange-800 dark:text-orange-200 mb-3">
            ⚠️ Pause Price Feed (Emergency Mode)
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Emergency Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter emergency price (e.g., 2000.00)"
                value={emergencyPrice}
                onChange={(e) => setEmergencyPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                          focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={selectedTokenData.useEmergency}
              />
            </div>
            <button
              onClick={handlePausePriceFeed}
              disabled={!emergencyPrice || isPending || selectedTokenData.useEmergency}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 
                        text-white rounded-lg font-medium transition-colors
                        disabled:cursor-not-allowed"
            >
              {isPending ? 'Pausing...' : `Pause ${selectedToken} Price Feed`}
            </button>
            {selectedTokenData.useEmergency && (
              <div className="text-sm text-orange-600 dark:text-orange-400">
                ⚠️ This token is already in emergency mode
              </div>
            )}
          </div>
        </div>

        {/* Resume Price Feed */}
        <div className="border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="font-medium text-green-800 dark:text-green-200 mb-3">
            ✅ Resume Normal Price Feed
          </h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              This will resume normal Chainlink price feed operation. 
              The price feed must be healthy to resume.
            </div>
            <button
              onClick={handleResumePriceFeed}
              disabled={isPending || !selectedTokenData.useEmergency}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 
                        text-white rounded-lg font-medium transition-colors
                        disabled:cursor-not-allowed"
            >
              {isPending ? 'Resuming...' : `Resume ${selectedToken} Price Feed`}
            </button>
            {!selectedTokenData.useEmergency && (
              <div className="text-sm text-green-600 dark:text-green-400">
                ✅ This token is already in normal mode
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="text-red-400">⚠️</div>
          </div>
          <div className="ml-3">
            <div className="text-sm text-red-800 dark:text-red-200">
              <strong>Admin Controls</strong>
            </div>
            <div className="text-sm text-red-600 dark:text-red-300 mt-1">
              These controls affect the entire protocol. Use emergency mode only when 
              Chainlink price feeds are unavailable or providing incorrect data. 
              Always resume normal operation when feeds become healthy again.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}