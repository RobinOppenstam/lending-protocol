// src/config/wagmi.ts
import { sepolia, mainnet } from 'wagmi/chains';
import {
  rainbowWallet,
  walletConnectWallet,
  injectedWallet,
  metaMaskWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [injectedWallet, metaMaskWallet, rainbowWallet],
    },
    {
      groupName: 'Other',
      wallets: [walletConnectWallet],
    },
  ],
  {
    appName: 'DeFi Lending Protocol',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  }
);

export const config = createConfig({
  connectors,
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: true,
});