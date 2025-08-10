// src/components/Dashboard.tsx
'use client';

import { useAccount } from 'wagmi';
import { useUserPosition } from '@/hooks/useUserPosition';
import { UserOverview } from './UserOverview';
import { MarketsList } from './MarketsList';
import { LendingForm } from './LendingForm';
import { useState } from 'react';
import { ActionType, Market } from '@/types/defi';
import { Wallet, TrendingUp, DollarSign, Shield } from 'lucide-react';
import { AssetPrices } from './AssetPrices';

export function Dashboard() {
  const { isConnected } = useAccount();
  const { userPosition, isLoading, refetch } = useUserPosition();
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const handleMarketAction = (action: ActionType, market: Market) => {
    setSelectedAction(action);
    setSelectedMarket(market);
  };

  if (!isConnected) {
    return <WelcomeScreen />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Hasse Calor's DeFi Lending
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Supply assets to earn interest, or use them as collateral to borrow other assets. 
            All transactions are secured by smart contracts on Ethereum.
          </p>
        </div>

        {/* Asset Prices */}
        <AssetPrices />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* User Overview - Takes 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            <UserOverview userPosition={userPosition} isLoading={isLoading} onRefresh={refetch} />
            <MarketsList onAction={handleMarketAction} />
          </div>
          
          {/* Actions Panel - Takes 1 column */}
          <div className="lg:col-span-1">
            <LendingForm 
              selectedAction={selectedAction}
              selectedMarket={selectedMarket}
              onClose={() => {
                setSelectedAction(null);
                setSelectedMarket(null);
              }}
              onTransactionSuccess={refetch}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Welcome screen for non-connected users
function WelcomeScreen() {
  const features = [
    {
      icon: DollarSign,
      title: 'Earn Interest',
      description: 'Supply your assets and earn competitive interest rates'
    },
    {
      icon: TrendingUp,
      title: 'Borrow Assets',
      description: 'Use your crypto as collateral to borrow other assets'
    },
    {
      icon: Shield,
      title: 'Secure Protocol',
      description: 'All funds are secured by audited smart contracts'
    },
    {
      icon: Wallet,
      title: 'Non-Custodial',
      description: 'You maintain full control of your assets at all times'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            DeFi Lending Protocol
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The future of decentralized finance. Supply, borrow, and earn with complete transparency and security.
          </p>
        </div>

        {/* Connect Wallet CTA */}
        <div className="bg-card rounded-2xl p-8 card-shadow">
          <div className="space-y-4">
            <Wallet className="w-16 h-16 mx-auto text-blue-500" />
            <h3 className="text-2xl font-semibold text-card-foreground">
              Connect Your Wallet
            </h3>
            <p className="text-muted-foreground">
              Connect your wallet to start lending and borrowing on the Sepolia testnet
            </p>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Don't have testnet funds? Get Sepolia ETH from{' '}
                <a 
                  href="https://sepoliafaucet.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 underline"
                >
                  faucets
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card rounded-xl p-6 card-shadow hover-scale"
            >
              <feature.icon className="w-10 h-10 text-blue-500 mb-4" />
              <h4 className="text-lg font-semibold text-card-foreground mb-2">
                {feature.title}
              </h4>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Preview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-black rounded-xl p-6 mt-8">
          <h4 className="text-lg font-semibold text-card-foreground mb-4">
            Protocol Statistics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">2</div>
              <div className="text-sm text-muted-foreground">Markets Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0-15%</div>
              <div className="text-sm text-muted-foreground">APY Range</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">80%</div>
              <div className="text-sm text-muted-foreground">Max LTV</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
