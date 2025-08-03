'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contracts } from '@/config/contracts';
import { parseUnits } from 'viem';
import { AlertCircle, CheckCircle, Settings } from 'lucide-react';

export function OracleAdmin() {
  const { address } = useAccount();
  const [lethPrice, setLethPrice] = useState('2000'); // $2000 for ETH
  const [lusdcPrice, setLusdcPrice] = useState('1'); // $1 for USDC
  const [isOpen, setIsOpen] = useState(false);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleSetPrices = async () => {
    if (!address) return;

    try {
      // Convert prices to wei (1e18 scale)
      const lethPriceWei = parseUnits(lethPrice, 18);
      const lusdcPriceWei = parseUnits(lusdcPrice, 18);

      console.log('Setting oracle prices:', {
        lETH: {
          address: contracts.lETH.address,
          price: lethPrice,
          priceWei: lethPriceWei.toString()
        },
        lUSDC: {
          address: contracts.lUSDC.address,
          price: lusdcPrice,
          priceWei: lusdcPriceWei.toString()
        }
      });

      // Set prices for both tokens using setPrices batch function
      writeContract({
        address: contracts.priceOracle.address,
        abi: contracts.priceOracle.abi,
        functionName: 'setPrices',
        args: [
          [contracts.lETH.address, contracts.lUSDC.address],
          [lethPriceWei, lusdcPriceWei]
        ],
        gas: BigInt(200000),
      });
    } catch (error) {
      console.error('Failed to set oracle prices:', error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
        title="Oracle Admin"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Oracle Admin
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            lETH Price (USD)
          </label>
          <input
            type="number"
            value={lethPrice}
            onChange={(e) => setLethPrice(e.target.value)}
            placeholder="2000"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            lUSDC Price (USD)
          </label>
          <input
            type="number"
            value={lusdcPrice}
            onChange={(e) => setLusdcPrice(e.target.value)}
            placeholder="1"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
        </div>

        <button
          onClick={handleSetPrices}
          disabled={isPending || isConfirming}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isPending || isConfirming ? 'Setting Prices...' : 'Set Oracle Prices'}
        </button>

        {isSuccess && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Oracle prices set successfully!
              </span>
            </div>
          </div>
        )}

        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              <p className="font-medium">Note:</p>
              <p>This requires you to be the oracle contract owner. Prices are set with 1e18 precision.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}