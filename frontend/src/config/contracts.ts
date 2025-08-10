export const contracts = {
  // ✅ FRESH DEPLOYMENT WITH FIXED PARAMETERS - NO MORE EXCHANGE RATE EXPLOSION!
  comptroller: {
    address: '0x300068b3EA3d6080065f31d6914c818aFbf69671' as `0x${string}`, // NEW: Fixed deployment with safe parameters
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
  
  chainlinkPriceOracle: {
    address: '0xdbb126a47D145AcdF08569950E6027f5D55153e1' as `0x${string}`, // NEW: ChainlinkPriceOracleV2 with real live prices
    abi: [
      {
        name: 'getUnderlyingPrice',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'lToken', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'getPriceWithMetadata',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'lToken', type: 'address' }],
        outputs: [
          { name: 'price', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' },
          { name: 'isStale', type: 'bool' }
        ]
      },
      {
        name: 'checkPriceFeedHealth',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'lToken', type: 'address' }],
        outputs: [
          { name: 'healthy', type: 'bool' },
          { name: 'reason', type: 'string' }
        ]
      },
      {
        name: 'getBatchPrices',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'lTokens', type: 'address[]' }],
        outputs: [{ name: 'prices', type: 'uint256[]' }]
      },
      {
        name: 'useEmergencyPrice',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'lToken', type: 'address' }],
        outputs: [{ name: '', type: 'bool' }]
      },
      {
        name: 'emergencyPrices',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'lToken', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'MIN_PRICE',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'MAX_PRICE',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'MAX_PRICE_AGE',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'getMaxPriceAge',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'lToken', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'assetTypes',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'lToken', type: 'address' }],
        outputs: [{ name: '', type: 'uint8' }]
      },
      {
        name: 'DEFAULT_MAX_PRICE_AGE',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'STABLECOIN_MAX_PRICE_AGE',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'resumePriceFeed',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'lToken', type: 'address' }],
        outputs: []
      },
      {
        name: 'pausePriceFeed',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'lToken', type: 'address' },
          { name: 'emergencyPrice', type: 'uint256' }
        ],
        outputs: []
      }
    ] as const,
  },
  
  lUSDC: {
    address: '0x2035a1Ad5542388108aa3ec0EA4cc995422252F6' as `0x${string}`, // NEW: Fresh lUSDC with normal exchange rate
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
    address: '0xd6d3BfA05F1c24Ad1f8056328341c6BBE598Bc2a' as `0x${string}`, // NEW: Fresh lETH with normal exchange rate
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
  
  wbtc: {
    address: '0x29f2D40B0605204364af54EC677bD022dA425d03' as `0x${string}`, // Sepolia WBTC
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
  
  link: {
    address: '0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5' as `0x${string}`, // Sepolia LINK
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
  
  usdt: {
    address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0' as `0x${string}`, // Sepolia USDT
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
  
  lWBTC: {
    address: '0x11245Da0D7A2b69f661d715CB20a11A41140ae8F' as `0x${string}`, // NEW: Wrapped Bitcoin lToken
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
  
  lLINK: {
    address: '0x02266A9d79Aa697780cC87E95dFcC87c83f7a560' as `0x${string}`, // NEW: Chainlink lToken
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
  
  lUSDT: {
    address: '0x7B03e675C406c8fDC75Ea5c252acA6EdecdB1CAF' as `0x${string}`, // NEW: Tether lToken
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
} as const;

// Contract addresses for easy access
export const addresses = {
  comptroller: contracts.comptroller.address,
  priceOracle: contracts.chainlinkPriceOracle.address,
  lUSDC: contracts.lUSDC.address,
  lETH: contracts.lETH.address,
  lWBTC: contracts.lWBTC.address,
  lLINK: contracts.lLINK.address,
  lUSDT: contracts.lUSDT.address,
  usdc: contracts.usdc.address,
  weth: contracts.weth.address,
  wbtc: contracts.wbtc.address,
  link: contracts.link.address,
  usdt: contracts.usdt.address,
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
  {
    symbol: 'lWBTC',
    name: 'Wrapped Bitcoin',
    lTokenAddress: contracts.lWBTC.address,
    underlyingAddress: contracts.wbtc.address,
    underlyingSymbol: 'WBTC',
    decimals: 8,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
    collateralFactor: 0.7, // 70% - Conservative for volatile asset
    liquidationThreshold: 0.75, // 75%
  },
  {
    symbol: 'lLINK',
    name: 'Chainlink',
    lTokenAddress: contracts.lLINK.address,
    underlyingAddress: contracts.link.address,
    underlyingSymbol: 'LINK',
    decimals: 18,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png',
    collateralFactor: 0.65, // 65% - Oracle token, moderate risk
    liquidationThreshold: 0.72, // 72%
  },
  {
    symbol: 'lUSDT',
    name: 'Tether USD',
    lTokenAddress: contracts.lUSDT.address,
    underlyingAddress: contracts.usdt.address,
    underlyingSymbol: 'USDT',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    collateralFactor: 0.8, // 80% - Stablecoin like USDC
    liquidationThreshold: 0.85, // 85%
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