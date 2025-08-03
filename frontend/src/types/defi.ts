// src/types/defi.ts
export interface Market {
  symbol: string;
  name: string;
  lTokenAddress: `0x${string}`;
  underlyingAddress: `0x${string}`;
  underlyingSymbol: string;
  decimals: number;
  icon: string;
  collateralFactor: number;
  liquidationThreshold: number;
}

export interface MarketData {
  // Market state
  totalSupply: bigint;
  totalBorrows: bigint;
  supplyRate: bigint;
  borrowRate: bigint;
  exchangeRate: bigint;
  cash: bigint;
  utilizationRate: number;
  
  // User positions
  userSupplyBalance: bigint;
  userBorrowBalance: bigint;
  userCollateralValue: number;
  
  // Calculated values
  supplyAPY: number;
  borrowAPY: number;
  liquidity: number;
  price: number;
}

export interface UserPosition {
  // Balances in underlying tokens
  totalSuppliedUSD: number;
  totalBorrowedUSD: number;
  totalCollateralUSD: number;
  
  // Risk metrics
  borrowLimitUSD: number;
  borrowLimitUsed: number; // Percentage
  liquidationThreshold: number;
  healthFactor: number;
  
  // Individual market positions
  positions: {
    [marketSymbol: string]: {
      supplied: bigint;
      borrowed: bigint;
      suppliedUSD: number;
      borrowedUSD: number;
      apy: {
        supply: number;
        borrow: number;
      };
    };
  };
}

export interface TransactionState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  hash?: `0x${string}`;
}

export interface LendingAction {
  type: 'supply' | 'borrow' | 'repay' | 'withdraw';
  market: Market;
  amount: string;
  amountUSD: number;
}

export interface PriceData {
  [tokenAddress: string]: {
    usd: number;
    usd_24h_change: number;
    last_updated_at: number;
  };
}

// Utility types
export type ActionType = 'supply' | 'borrow' | 'repay' | 'withdraw';
export type TokenSymbol = 'USDC' | 'WETH' | 'lUSDC' | 'lETH';

// Hook return types
export interface UseMarketDataReturn {
  marketData: MarketData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseUserPositionReturn {
  userPosition: UserPosition | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseLendingActionsReturn {
  supply: (market: Market, amount: string) => Promise<void>;
  borrow: (market: Market, amount: string) => Promise<void>;
  repay: (market: Market, amount: string) => Promise<void>;
  withdraw: (market: Market, amount: string) => Promise<void>;
  approve: (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: string) => Promise<void>;
  enterMarkets: (markets: `0x${string}`[]) => Promise<void>;
  
  // Transaction state
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  hash?: `0x${string}`;
}

// Component props types
export interface MarketRowProps {
  market: Market;
  marketData: MarketData;
  onAction: (action: ActionType, market: Market) => void;
}

export interface UserOverviewProps {
  userPosition: UserPosition | undefined;
  isLoading: boolean;
}

export interface LendingFormProps {
  selectedMarket?: Market;
  selectedAction?: ActionType;
  onClose?: () => void;
}

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: ActionType;
  market: Market;
}

// API response types
export interface ContractReadResult<T = any> {
  data: T;
  isError: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Constants
export const BLOCKS_PER_YEAR = 2628000; // Approximate blocks per year
export const SECONDS_PER_YEAR = 31536000; // 365 * 24 * 60 * 60

// Utility functions types
export interface FormatOptions {
  decimals?: number;
  compact?: boolean;
  currency?: boolean;
}

export interface CalculateAPYOptions {
  ratePerBlock: bigint; // Note: This is actually an annual rate from the smart contract, not per-block
  blocksPerYear?: number; // Deprecated - not used since ratePerBlock is annual
}