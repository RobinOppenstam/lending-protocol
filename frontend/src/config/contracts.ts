export const contracts = {
  // ✅ UPDATED WITH NEW DEPLOYED CONTRACT ADDRESSES
  comptroller: {
    address: '0x0b1C31213d3181Fd9b9fd159288F84adB2825e97' as `0x${string}`, // New fixed comptroller
    abi: [
      {
        name: 'accountMembership',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'account', type: 'address' },
          { name: 'lToken', type: 'address' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'getAccountLiquidity',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [
          { name: 'liquidity', type: 'uint256' },
          { name: 'shortfall', type: 'uint256' }
        ]
      },
      {
        name: 'enterMarkets',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'lTokens', type: 'address[]' }],
        outputs: []
      },
      {
        name: 'exitMarket',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'lTokenAddress', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'markets',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'address' }],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'borrowAllowed',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'lToken', type: 'address' },
          { name: 'borrower', type: 'address' },
          { name: 'borrowAmount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'oracle',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }]
      },
      {
        name: 'closeFactorMantissa',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'liquidationIncentiveMantissa',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ] as const,
  },
  
  priceOracle: {
    address: '0x313ED33288c24768Db927Cfb7Af0304149f426Ff' as `0x${string}`, // New fixed price oracle
    abi: [
      {
        name: 'getUnderlyingPrice',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'lToken', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'prices',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'setPrice',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'lToken', type: 'address' },
          { name: 'price', type: 'uint256' }
        ],
        outputs: []
      },
      {
        name: 'setPrices',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'lTokens', type: 'address[]' },
          { name: 'prices', type: 'uint256[]' }
        ],
        outputs: []
      }
    ] as const,
  },
  
  lUSDC: {
    address: '0xbAc6bF46B37490ac71f31735E9dA3752c5664036' as `0x${string}`, // New fixed lUSDC token
    abi: [
      {
        name: 'supply',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'supplyAmount', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'redeem',
        type: 'function', 
        stateMutability: 'nonpayable',
        inputs: [{ name: 'redeemTokens', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'borrow',
        type: 'function',
        stateMutability: 'nonpayable', 
        inputs: [{ name: 'borrowAmount', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'repayBorrow',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'repayAmount', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'exchangeRateStored',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'getSupplyRate',
        type: 'function',
        stateMutability: 'view', 
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'getBorrowRate',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'getCash',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'totalBorrows',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'accountTokens',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'borrowBalanceStored',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ] as const,
  },
  
  lETH: {
    address: '0xFAf79f14f3418d61516a25CE61AF4e4b737CF7B8' as `0x${string}`, // New fixed lETH token
    abi: [
      {
        name: 'supply',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'supplyAmount', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'redeem',
        type: 'function', 
        stateMutability: 'nonpayable',
        inputs: [{ name: 'redeemTokens', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'borrow',
        type: 'function',
        stateMutability: 'nonpayable', 
        inputs: [{ name: 'borrowAmount', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'repayBorrow',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'repayAmount', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'exchangeRateStored',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'getSupplyRate',
        type: 'function',
        stateMutability: 'view', 
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'getBorrowRate',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'getCash',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'totalBorrows',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'accountTokens',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'borrowBalanceStored',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ] as const,
  },
  
  usdc: {
    address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as `0x${string}`, // Sepolia USDC
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'transferFrom',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }]
      },
      {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }]
      },
      {
        name: 'name',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }]
      }
    ] as const,
  },
  
  weth: {
    address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as `0x${string}`, // Sepolia WETH
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'allowance',
        type: 'function',
        stateMutability: 'view',
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'transferFrom',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }]
      },
      {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }]
      },
      {
        name: 'name',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }]
      }
    ] as const,
  },
} as const;

// Market configuration - Updated for new deployment
export const markets = [
  {
    symbol: 'lUSDC',
    name: 'USD Coin',
    lTokenAddress: contracts.lUSDC.address,
    underlyingAddress: contracts.usdc.address,
    underlyingSymbol: 'USDC',
    decimals: 6,
    icon: '/usdc_logo.png',
    collateralFactor: 0.8, // 80% - Fixed deployment
    liquidationThreshold: 0.85, // 85%
  },
  {
    symbol: 'lETH', 
    name: 'Ethereum',
    lTokenAddress: contracts.lETH.address,
    underlyingAddress: contracts.weth.address,
    underlyingSymbol: 'WETH',
    decimals: 18,
    icon: '/Eth_logo.png',
    collateralFactor: 0.75, // 75% - Fixed deployment
    liquidationThreshold: 0.82, // 82%
  },
] as const;

// Utility function to update contract addresses after deployment
export function updateContractAddresses(addresses: {
  comptroller: `0x${string}`;
  priceOracle: `0x${string}`;
  lUSDC: `0x${string}`;
  lETH: `0x${string}`;
}) {
  // This is a simple way to update addresses
  // In production, you might want to use environment variables
  console.log('Contract addresses to update:', addresses);
  
  // You can also create a separate config file with just addresses
  // and import it here for cleaner separation
}

// Environment-specific configurations
export const networkConfig = {
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
    },
  },
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;