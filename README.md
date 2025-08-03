DeFi Lending Protocol
A comprehensive decentralized lending protocol built with Solidity, Foundry, Next.js, Wagmi, and RainbowKit. This protocol allows users to supply assets as collateral, borrow against them, and earn interest on supplied assets.
🏗️ Architecture Overview

Smart Contracts: Solidity contracts deployed on Ethereum (Sepolia testnet)
Frontend: Next.js with TypeScript, Wagmi, and RainbowKit
Development: Foundry for smart contract development and testing
Interest Rate Model: Compound-style kinked interest rate model

📊 DeFi Parameters Explained
Interest Rate Model Parameters
ParameterValueDescriptionBase Rate2%Minimum interest rate when utilization = 0%Multiplier20%Rate increase per utilization point up to kinkJump Multiplier109%Steep rate increase after kink pointKink80%Optimal utilization rate target
Formula:

If utilization ≤ 80%: borrowRate = baseRate + (utilization × multiplier)
If utilization > 80%: borrowRate = baseRate + (kink × multiplier) + ((utilization - kink) × jumpMultiplier)

Risk Management Parameters
ParameterUSDCETHDescriptionCollateral Factor80%75%Maximum borrowing power per $1 of collateralLiquidation Threshold85%82%When positions become liquidatableLiquidation Penalty8%8%Bonus given to liquidatorsReserve Factor10%10%Protocol fee taken from interestClose Factor50%50%Maximum % of debt liquidatable in one transaction
Example Scenarios
Scenario 1: Conservative Borrowing

Supply: $1,000 USDC
Borrow Limit: $800 (80% collateral factor)
Safe Borrow: $600 (75% utilization)
Liquidation Risk: Low

Scenario 2: Aggressive Borrowing

Supply: $1,000 USDC
Borrow: $790 (79% utilization)
Liquidation Risk: High - close to threshold

🚀 Quick Start
Prerequisites

Node.js 18+
Git
Foundry

1. Clone and Setup
bashgit clone <your-repo>
cd defi-lending-protocol

# Install dependencies
npm install

# Install Foundry dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install smartcontractkit/chainlink-brownie-contracts
2. Environment Setup
bash# Copy environment file
cp .env.example .env

# Add your keys to .env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_etherscan_api_key
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
3. Deploy Contracts
bash# Compile contracts
forge build

# Run tests
forge test

# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
4. Update Frontend Config
Update src/config/contracts.ts with your deployed contract addresses:
typescriptexport const contracts = {
  comptroller: {
    address: '0xYOUR_COMPTROLLER_ADDRESS',
    // ...
  },
  lUSDC: {
    address: '0xYOUR_LUSDC_ADDRESS',
    // ...
  },
  // ...
};
5. Run Frontend
bashnpm run dev
Visit http://localhost:3000
🧪 Testing
Smart Contract Tests
bash# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testSupply

# Generate coverage report
forge coverage
Test Scenarios Covered

✅ Supply assets and receive lTokens
✅ Redeem lTokens for underlying assets
✅ Borrow against collateral
✅ Repay borrowed assets
✅ Interest rate calculations
✅ Exchange rate updates
✅ Liquidation mechanics
✅ Access controls
✅ Edge cases and failure modes

🎯 Core Features
For Users

Supply & Earn: Deposit assets and earn interest
Borrow: Use collateral to borrow other assets
Real-time Rates: Dynamic interest rates based on utilization
Risk Monitoring: Clear visualization of liquidation risk

For Developers

Modular Design: Separate contracts for different concerns
Upgradeable: Owner functions for parameter adjustments
Gas Optimized: Efficient storage and computation
Comprehensive Tests: High test coverage

📱 Frontend Features
Dashboard

Portfolio overview with total supplied/borrowed
Borrow limit utilization with visual indicators
Real-time APY calculations

Markets

Live market data for all supported assets
Supply/borrow APY for each market
Liquidity and utilization metrics

Lending Interface

Supply, borrow, repay, and redeem actions
Token approval handling
Transaction status tracking
Balance checks and validation

🔒 Security Considerations
Implemented Protections

Reentrancy Guards: All external calls protected
Integer Overflow: Using Solidity 0.8+ built-in checks
Access Controls: Owner-only functions for critical parameters
Pausable: Emergency pause functionality
Price Oracle: External price feeds (TODO: implement)

Known Limitations

Price Oracle: Currently missing - implement Chainlink oracles
Flash Loan Protection: Consider adding flash loan attack prevention
Governance: No timelock for parameter changes
Multi-sig: Single owner instead of multi-signature wallet

🛠️ Advanced Configuration
Modifying Interest Rates
solidity// Deploy new interest rate model
InterestRateModel newModel = new InterestRateModel(
    1e16,    // 1% base rate (lower)
    15e16,   // 15% multiplier (lower)
    2e18,    // 200% jump multiplier (higher)
    85e16    // 85% kink (higher)
);

// Update LToken to use new model
lToken.setInterestRateModel(address(newModel));
Adding New Markets
solidity// Deploy new LToken
LToken lDAI = new LToken(
    IERC20(daiAddress),
    interestModel,
    "Lending DAI",
    "lDAI"
);

// List in comptroller
comptroller.listMarket(address(lDAI));

// Set risk parameters
lDAI.setCollateralFactor(0.85e18);  // 85% for stablecoins
lDAI.setReserveFactor(0.15e18);     // 15% protocol fee
📈 Monitoring & Analytics
Key Metrics to Track

Total Value Locked (TVL): Sum of all supplied assets
Utilization Rates: Per-market borrowing activity
Interest Rate Spreads: Difference between supply/borrow rates
Liquidation Events: Frequency and amounts
Protocol Revenue: Fees collected via reserve factor

Useful Queries
typescript// Get market utilization
const utilization = (totalBorrows * 100) / (cash + totalBorrows);

// Calculate protocol revenue
const protocolRevenue = totalReserves * underlyingPrice;

// Check liquidation eligibility
const { liquidity, shortfall } = await comptroller.getAccountLiquidity(user);
const canLiquidate = shortfall > 0;
🚧 Roadmap
Phase 1 (Current)

✅ Basic lending/borrowing functionality
✅ Interest rate model
✅ Frontend interface
✅ Comprehensive testing

Phase 2 (Next)

 Chainlink price oracles integration
 Liquidation bot implementation
 Gas optimization improvements
 Additional token markets

Phase 3 (Future)

 Governance token and voting
 Flash loans functionality
 Cross-chain deployment
 Advanced analytics dashboard

📄 License
MIT License - see LICENSE file for details.
🤝 Contributing

Fork the repository
Create a feature branch
Make your changes
Add tests for new functionality
Submit a pull request

📞 Support

Create an issue for bugs or feature requests
Join our Discord for community support
Check the documentation for detailed guides


⚠️ Important: This is a testnet implementation. Do not use with real funds without proper audits and security reviews.
