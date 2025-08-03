## Project Overview

- This is what we are building

# DeFi Lending Protocol

A comprehensive decentralized lending protocol built with Solidity, Foundry, Next.js, Wagmi, and RainbowKit. This protocol allows users to supply assets as collateral, borrow against them, and earn interest on supplied assets.

## 🏗️ Architecture Overview

- **Smart Contracts**: Solidity contracts deployed on Ethereum (Sepolia testnet)
- **Frontend**: Next.js with TypeScript, Wagmi, and RainbowKit
- **Development**: Foundry for smart contract development and testing
- **Interest Rate Model**: Compound-style kinked interest rate model

## 📊 DeFi Parameters Explained

### Interest Rate Model Parameters

| Parameter | Value | Description |
|-----------|--------|-------------|
| **Base Rate** | 2% | Minimum interest rate when utilization = 0% |
| **Multiplier** | 20% | Rate increase per utilization point up to kink |
| **Jump Multiplier** | 109% | Steep rate increase after kink point |
| **Kink** | 80% | Optimal utilization rate target |

**Formula**: 
- If utilization ≤ 80%: `borrowRate = baseRate + (utilization × multiplier)`
- If utilization > 80%: `borrowRate = baseRate + (kink × multiplier) + ((utilization - kink) × jumpMultiplier)`

### Risk Management Parameters

| Parameter | USDC | ETH | Description |
|-----------|------|-----|-------------|
| **Collateral Factor** | 80% | 75% | Maximum borrowing power per $1 of collateral |
| **Liquidation Threshold** | 85% | 82% | When positions become liquidatable |
| **Liquidation Penalty** | 8% | 8% | Bonus given to liquidators |
| **Reserve Factor** | 10% | 10% | Protocol fee taken from interest |
| **Close Factor** | 50% | 50% | Maximum % of debt liquidatable in one transaction |

### Example Scenarios

**Scenario 1: Conservative Borrowing**
- Supply: $1,000 USDC
- Borrow Limit: $800 (80% collateral factor)
- Safe Borrow: $600 (75% utilization)
- Liquidation Risk: Low

**Scenario 2: Aggressive Borrowing**
- Supply: $1,000 USDC  
- Borrow: $790 (79% utilization)
- Liquidation Risk: High - close to threshold

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Git
- Foundry

### 1. Clone and Setup

```bash
git clone <your-repo>
cd defi-lending-protocol

# Install dependencies
npm install

# Install Foundry dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install smartcontractkit/chainlink-brownie-contracts
```

### 2. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Add your keys to .env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_etherscan_api_key
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### 3. Deploy Contracts

```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
```

### 4. Update Frontend Config

Update `src/config/contracts.ts` with your deployed contract addresses:

```typescript
export const contracts = {
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
```

### 5. Run Frontend

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🧪 Testing

### Smart Contract Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testSupply

# Generate coverage report
forge coverage
```

### Test Scenarios Covered

- ✅ Supply assets and receive lTokens
- ✅ Redeem lTokens for underlying assets  
- ✅ Borrow against collateral
- ✅ Repay borrowed assets
- ✅ Interest rate calculations
- ✅ Exchange rate updates
- ✅ Liquidation mechanics
- ✅ Access controls
- ✅ Edge cases and failure modes

## 🎯 Core Features

### For Users
- **Supply & Earn**: Deposit assets and earn interest
- **Borrow**: Use collateral to borrow other assets
- **Real-time Rates**: Dynamic interest rates based on utilization
- **Risk Monitoring**: Clear visualization of liquidation risk

### For Developers
- **Modular Design**: Separate contracts for different concerns
- **Upgradeable**: Owner functions for parameter adjustments
- **Gas Optimized**: Efficient storage and computation
- **Comprehensive Tests**: High test coverage

## 📱 Frontend Features

### Dashboard
- Portfolio overview with total supplied/borrowed
- Borrow limit utilization with visual indicators
- Real-time APY calculations

### Markets
- Live market data for all supported assets
- Supply/borrow APY for each market
- Liquidity and utilization metrics

### Lending Interface
- Supply, borrow, repay, and redeem actions
- Token approval handling
- Transaction status tracking
- Balance checks and validation

## 🔒 Security Considerations

### Implemented Protections
- **Reentrancy Guards**: All external calls protected
- **Integer Overflow**: Using Solidity 0.8+ built-in checks
- **Access Controls**: Owner-only functions for critical parameters
- **Pausable**: Emergency pause functionality
- **Price Oracle**: External price feeds (TODO: implement)

### Known Limitations
- **Price Oracle**: Currently missing - implement Chainlink oracles
- **Flash Loan Protection**: Consider adding flash loan attack prevention
- **Governance**: No timelock for parameter changes
- **Multi-sig**: Single owner instead of multi-signature wallet

## 🛠️ Advanced Configuration

### Modifying Interest Rates

```solidity
// Deploy new interest rate model
InterestRateModel newModel = new InterestRateModel(
    1e16,    // 1% base rate (lower)
    15e16,   // 15% multiplier (lower)
    2e18,    // 200% jump multiplier (higher)
    85e16    // 85% kink (higher)
);

// Update LToken to use new model
lToken.setInterestRateModel(address(newModel));
```

### Adding New Markets

```solidity
// Deploy new LToken
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
```

## 📈 Monitoring & Analytics

### Key Metrics to Track
- **Total Value Locked (TVL)**: Sum of all supplied assets
- **Utilization Rates**: Per-market borrowing activity
- **Interest Rate Spreads**: Difference between supply/borrow rates
- **Liquidation Events**: Frequency and amounts
- **Protocol Revenue**: Fees collected via reserve factor

### Useful Queries

```typescript
// Get market utilization
const utilization = (totalBorrows * 100) / (cash + totalBorrows);

// Calculate protocol revenue
const protocolRevenue = totalReserves * underlyingPrice;

// Check liquidation eligibility
const { liquidity, shortfall } = await comptroller.getAccountLiquidity(user);
const canLiquidate = shortfall > 0;
```

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Basic lending/borrowing functionality
- ✅ Interest rate model
- ✅ Frontend interface
- ✅ Comprehensive testing

### Phase 2 (Next)
- [ ] Chainlink price oracles integration
- [ ] Liquidation bot implementation
- [ ] Gas optimization improvements
- [ ] Additional token markets

### Phase 3 (Future)
- [ ] Governance token and voting
- [ ] Flash loans functionality
- [ ] Cross-chain deployment
- [ ] Advanced analytics dashboard

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

- Create an issue for bugs or feature requests
- Join our Discord for community support
- Check the documentation for detailed guides

---

**⚠️ Important**: This is a testnet implementation. Do not use with real funds without proper audits and security reviews.


Smartcontract for context:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Interest Rate Model Contract
contract InterestRateModel {
    uint256 public constant BLOCKS_PER_YEAR = 2628000; // ~12 sec blocks
    uint256 private constant BASE = 1e18;
    
    // Interest rate model parameters
    uint256 public baseRatePerYear;
    uint256 public multiplierPerYear;
    uint256 public jumpMultiplierPerYear;
    uint256 public kink;
    
    constructor(
        uint256 _baseRatePerYear,      // 2% = 2e16
        uint256 _multiplierPerYear,    // 20% = 2e17
        uint256 _jumpMultiplierPerYear, // 109% = 1.09e18
        uint256 _kink                  // 80% = 8e17
    ) {
        baseRatePerYear = _baseRatePerYear;
        multiplierPerYear = _multiplierPerYear;
        jumpMultiplierPerYear = _jumpMultiplierPerYear;
        kink = _kink;
    }
    
    function utilizationRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves
    ) public pure returns (uint256) {
        if (borrows == 0) return 0;
        return (borrows * BASE) / (cash + borrows - reserves);
    }
    
    function getBorrowRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves
    ) public view returns (uint256) {
        uint256 util = utilizationRate(cash, borrows, reserves);
        
        if (util <= kink) {
            return (util * multiplierPerYear) / BASE + baseRatePerYear;
        } else {
            uint256 normalRate = (kink * multiplierPerYear) / BASE + baseRatePerYear;
            uint256 excessUtil = util - kink;
            return (excessUtil * jumpMultiplierPerYear) / BASE + normalRate;
        }
    }
    
    function getSupplyRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactorMantissa
    ) public view returns (uint256) {
        uint256 oneMinusReserveFactor = BASE - reserveFactorMantissa;
        uint256 borrowRate = getBorrowRate(cash, borrows, reserves);
        uint256 rateToPool = (borrowRate * oneMinusReserveFactor) / BASE;
        return (utilizationRate(cash, borrows, reserves) * rateToPool) / BASE;
    }
}

// Price Oracle Interface
interface IPriceOracle {
    function getUnderlyingPrice(address lToken) external view returns (uint256);
}

// LToken Contract (represents deposited assets)
contract LToken is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    
    IERC20 public underlying;
    InterestRateModel public interestRateModel;
    Comptroller public comptroller;
    
    // Protocol parameters
    uint256 public reserveFactorMantissa = 0.1e18; // 10%
    uint256 public collateralFactorMantissa = 0.75e18; // 75%
    uint256 public liquidationThresholdMantissa = 0.85e18; // 85%
    uint256 public liquidationIncentiveMantissa = 0.08e18; // 8%
    
    // Market state
    uint256 public totalSupply;
    uint256 public totalBorrows;
    uint256 public totalReserves;
    uint256 public borrowIndex = 1e18;
    uint256 public accrualBlockNumber;
    
    mapping(address => uint256) public accountTokens;
    mapping(address => uint256) public accountBorrows;
    mapping(address => uint256) public borrowBalanceSnapshots;
    
    // Events
    event Supply(address supplier, uint256 supplyAmount, uint256 lTokensMinted);
    event Redeem(address redeemer, uint256 lTokensRedeemed, uint256 underlyingRedeemed);
    event Borrow(address borrower, uint256 borrowAmount);
    event RepayBorrow(address borrower, uint256 repayAmount, uint256 accountBorrowsNew);
    event LiquidateBorrow(
        address liquidator,
        address borrower,
        uint256 repayAmount,
        address lTokenCollateral,
        uint256 seizeTokens
    );
    
    constructor(
        IERC20 _underlying,
        InterestRateModel _interestRateModel,
        string memory _name,
        string memory _symbol,
        address _initialOwner
    ) Ownable(_initialOwner) {
        underlying = _underlying;
        interestRateModel = _interestRateModel;
        name = _name;
        symbol = _symbol;
        accrualBlockNumber = block.number;
    }
    
    function accrueInterest() public returns (uint256) {
        uint256 currentBlockNumber = block.number;
        uint256 accrualBlockNumberPrior = accrualBlockNumber;
        
        if (accrualBlockNumberPrior == currentBlockNumber) {
            return 0; // Already accrued this block
        }
        
        uint256 cashPrior = getCash();
        uint256 borrowsPrior = totalBorrows;
        uint256 reservesPrior = totalReserves;
        uint256 borrowIndexPrior = borrowIndex;
        
        uint256 borrowRateMantissa = interestRateModel.getBorrowRate(
            cashPrior,
            borrowsPrior,
            reservesPrior
        );
        
        uint256 blockDelta = currentBlockNumber - accrualBlockNumberPrior;
        uint256 simpleInterestFactor = borrowRateMantissa * blockDelta;
        uint256 interestAccumulated = (simpleInterestFactor * borrowsPrior) / 1e18;
        
        totalBorrows = borrowsPrior + interestAccumulated;
        totalReserves = reservesPrior + (interestAccumulated * reserveFactorMantissa) / 1e18;
        borrowIndex = borrowIndexPrior + (simpleInterestFactor * borrowIndexPrior) / 1e18;
        accrualBlockNumber = currentBlockNumber;
        
        return 0;
    }
    
    function supply(uint256 supplyAmount) external nonReentrant returns (uint256) {
        require(supplyAmount > 0, "Supply amount must be greater than 0");
        accrueInterest();
        
        uint256 exchangeRate = exchangeRateStored();
        uint256 actualSupplyAmount = doTransferIn(msg.sender, supplyAmount);
        uint256 mintTokens = (actualSupplyAmount * 1e18) / exchangeRate;
        
        totalSupply += mintTokens;
        accountTokens[msg.sender] += mintTokens;
        
        emit Supply(msg.sender, actualSupplyAmount, mintTokens);
        return 0;
    }
    
    function redeem(uint256 redeemTokens) external nonReentrant returns (uint256) {
        accrueInterest();
        
        uint256 exchangeRate = exchangeRateStored();
        uint256 redeemAmount = (redeemTokens * exchangeRate) / 1e18;
        
        require(accountTokens[msg.sender] >= redeemTokens, "Insufficient balance");
        require(getCash() >= redeemAmount, "Insufficient cash");
        
        totalSupply -= redeemTokens;
        accountTokens[msg.sender] -= redeemTokens;
        
        doTransferOut(msg.sender, redeemAmount);
        
        emit Redeem(msg.sender, redeemTokens, redeemAmount);
        return 0;
    }
    
    function borrow(uint256 borrowAmount) external nonReentrant returns (uint256) {
        accrueInterest();
        
        require(getCash() >= borrowAmount, "Insufficient cash");
        
        // Check with comptroller if set
        if (address(comptroller) != address(0)) {
            uint256 allowed = comptroller.borrowAllowed(address(this), msg.sender, borrowAmount);
            require(allowed == 0, "Comptroller rejection");
        }
        
        uint256 accountBorrowsPrev = borrowBalanceStored(msg.sender);
        uint256 accountBorrowsNew = accountBorrowsPrev + borrowAmount;
        
        totalBorrows += borrowAmount;
        accountBorrows[msg.sender] = accountBorrowsNew;
        borrowBalanceSnapshots[msg.sender] = borrowIndex;
        
        doTransferOut(msg.sender, borrowAmount);
        
        emit Borrow(msg.sender, borrowAmount);
        return 0;
    }
    
    function repayBorrow(uint256 repayAmount) external nonReentrant returns (uint256) {
        accrueInterest();
        
        uint256 accountBorrowsPrev = borrowBalanceStored(msg.sender);
        uint256 actualRepayAmount = doTransferIn(msg.sender, repayAmount);
        
        uint256 accountBorrowsNew;
        if (actualRepayAmount >= accountBorrowsPrev) {
            accountBorrowsNew = 0;
            actualRepayAmount = accountBorrowsPrev;
        } else {
            accountBorrowsNew = accountBorrowsPrev - actualRepayAmount;
        }
        
        totalBorrows -= (accountBorrowsPrev - accountBorrowsNew);
        accountBorrows[msg.sender] = accountBorrowsNew;
        borrowBalanceSnapshots[msg.sender] = borrowIndex;
        
        emit RepayBorrow(msg.sender, actualRepayAmount, accountBorrowsNew);
        return 0;
    }
    
    // View functions
    function exchangeRateStored() public view returns (uint256) {
        if (totalSupply == 0) {
            return 1e18; // Initial exchange rate
        }
        
        uint256 totalCash = getCash();
        uint256 cashPlusBorrowsMinusReserves = totalCash + totalBorrows - totalReserves;
        return (cashPlusBorrowsMinusReserves * 1e18) / totalSupply;
    }
    
    function borrowBalanceStored(address account) public view returns (uint256) {
        uint256 snapshot = borrowBalanceSnapshots[account];
        if (snapshot == 0) {
            return accountBorrows[account];
        }
        uint256 principalTimesIndex = accountBorrows[account] * borrowIndex;
        return principalTimesIndex / snapshot;
    }
    
    function getCash() public view returns (uint256) {
        return underlying.balanceOf(address(this));
    }
    
    function getSupplyRate() public view returns (uint256) {
        return interestRateModel.getSupplyRate(
            getCash(),
            totalBorrows,
            totalReserves,
            reserveFactorMantissa
        );
    }
    
    function getBorrowRate() public view returns (uint256) {
        return interestRateModel.getBorrowRate(getCash(), totalBorrows, totalReserves);
    }
    
    function getAccountSnapshot(address account) public view returns (uint256, uint256, uint256) {
        return (
            accountTokens[account],
            borrowBalanceStored(account),
            exchangeRateStored()
        );
    }
    
    // Internal functions
    function doTransferIn(address from, uint256 amount) internal returns (uint256) {
        uint256 balanceBefore = underlying.balanceOf(address(this));
        underlying.safeTransferFrom(from, address(this), amount);
        uint256 balanceAfter = underlying.balanceOf(address(this));
        return balanceAfter - balanceBefore;
    }
    
    function doTransferOut(address to, uint256 amount) internal {
        underlying.safeTransfer(to, amount);
    }
    
    // Admin functions
    function setReserveFactor(uint256 newReserveFactorMantissa) external onlyOwner {
        require(newReserveFactorMantissa <= 0.5e18, "Reserve factor too high");
        reserveFactorMantissa = newReserveFactorMantissa;
    }
    
    function setCollateralFactor(uint256 newCollateralFactorMantissa) external onlyOwner {
        require(newCollateralFactorMantissa <= 0.9e18, "Collateral factor too high");
        collateralFactorMantissa = newCollateralFactorMantissa;
    }
    
    function setComptroller(Comptroller _comptroller) external onlyOwner {
        comptroller = _comptroller;
    }
}

// Comptroller Contract (Risk Management)
contract Comptroller is Ownable, Pausable {
    IPriceOracle public oracle;
    uint256 public closeFactorMantissa = 0.5e18; // 50%
    uint256 public liquidationIncentiveMantissa = 0.08e18; // 8%
    
    mapping(address => bool) public markets;
    mapping(address => address[]) public accountAssets;
    mapping(address => mapping(address => bool)) public accountMembership;
    
    event MarketListed(address lToken);
    event MarketEntered(address lToken, address account);
    event MarketExited(address lToken, address account);
    
    constructor(address _initialOwner) Ownable(_initialOwner) {}
    
    function setOracle(address _oracle) external onlyOwner {
        oracle = IPriceOracle(_oracle);
    }
    
    function listMarket(address lToken) external onlyOwner {
        require(!markets[lToken], "Market already listed");
        markets[lToken] = true;
        emit MarketListed(lToken);
    }
    
    function enterMarkets(address[] memory lTokens) external {
        for (uint256 i = 0; i < lTokens.length; i++) {
            enterMarket(lTokens[i]);
        }
    }
    
    function enterMarket(address lToken) internal {
        require(markets[lToken], "Market not listed");
        
        if (!accountMembership[msg.sender][lToken]) {
            accountMembership[msg.sender][lToken] = true;
            accountAssets[msg.sender].push(lToken);
            emit MarketEntered(lToken, msg.sender);
        }
    }
    
    function getAccountLiquidity(address account) 
        public 
        view 
        returns (uint256 liquidity, uint256 shortfall) 
    {
        (uint256 sumCollateral, uint256 sumBorrowPlusEffects) = 
            getHypotheticalAccountLiquidity(account, address(0), 0, 0);
        
        if (sumCollateral >= sumBorrowPlusEffects) {
            return (sumCollateral - sumBorrowPlusEffects, 0);
        } else {
            return (0, sumBorrowPlusEffects - sumCollateral);
        }
    }
    
    function getHypotheticalAccountLiquidity(
        address account,
        address lTokenModify,
        uint256 redeemTokens,
        uint256 borrowAmount
    ) public view returns (uint256 sumCollateral, uint256 sumBorrowPlusEffects) {
        address[] memory assets = accountAssets[account];
        
        for (uint256 i = 0; i < assets.length; i++) {
            (uint256 collateral, uint256 borrowValue) = _calculateAssetLiquidity(
                assets[i], 
                account, 
                assets[i] == lTokenModify ? redeemTokens : 0,
                assets[i] == lTokenModify ? borrowAmount : 0
            );
            
            sumCollateral += collateral;
            sumBorrowPlusEffects += borrowValue;
        }
        
        return (sumCollateral, sumBorrowPlusEffects);
    }
    
    function _calculateAssetLiquidity(
        address asset,
        address account,
        uint256 redeemTokens,
        uint256 borrowAmount
    ) internal view returns (uint256 collateral, uint256 borrowValue) {
        LToken lToken = LToken(asset);
        
        (uint256 lTokenBalance, uint256 borrowBalance, uint256 exchangeRate) = 
            lToken.getAccountSnapshot(account);
        uint256 underlyingPrice = oracle.getUnderlyingPrice(asset);
        
        // Skip if no oracle is set or price is 0
        if (address(oracle) == address(0) || underlyingPrice == 0) {
            return (0, 0);
        }
        
        // Calculate collateral value
        uint256 collateralValue = (lTokenBalance * exchangeRate * underlyingPrice) / (1e18 * 1e18);
        collateral = (collateralValue * lToken.collateralFactorMantissa()) / 1e18;
        
        // Apply redemption effect
        if (redeemTokens > 0) {
            uint256 redeemValue = (redeemTokens * exchangeRate * underlyingPrice) / (1e18 * 1e18);
            uint256 weightedRedeemValue = (redeemValue * lToken.collateralFactorMantissa()) / 1e18;
            collateral = collateral > weightedRedeemValue ? collateral - weightedRedeemValue : 0;
        }
        
        // Calculate borrow value
        borrowValue = (borrowBalance * underlyingPrice) / 1e18;
        
        // Apply additional borrow effect
        if (borrowAmount > 0) {
            borrowValue += (borrowAmount * underlyingPrice) / 1e18;
        }
    }
    
    function borrowAllowed(
        address lToken,
        address borrower,
        uint256 borrowAmount
    ) external view returns (uint256) {
        require(markets[lToken], "Market not listed");
        
        if (!accountMembership[borrower][lToken]) {
            return 1; // Not in market
        }
        
        (uint256 sumCollateral, uint256 sumBorrowPlusEffects) = getHypotheticalAccountLiquidity(
            borrower,
            lToken,
            0,
            borrowAmount
        );
        
        uint256 shortfall;
        if (sumCollateral >= sumBorrowPlusEffects) {
            shortfall = 0;
        } else {
            shortfall = sumBorrowPlusEffects - sumCollateral;
        }
        
        if (shortfall > 0) {
            return 2; // Insufficient liquidity
        }
        
        return 0; // Success
    }
    
    function liquidateBorrowAllowed(
        address lTokenBorrowed,
        address lTokenCollateral,
        address, // liquidator
        address borrower,
        uint256 repayAmount
    ) external view returns (uint256) {
        require(markets[lTokenBorrowed] && markets[lTokenCollateral], "Market not listed");
        
        (, uint256 shortfall) = getAccountLiquidity(borrower);
        if (shortfall == 0) {
            return 1; // Not liquidatable
        }
        
        uint256 borrowBalance = LToken(lTokenBorrowed).borrowBalanceStored(borrower);
        uint256 maxClose = (borrowBalance * closeFactorMantissa) / 1e18;
        
        if (repayAmount > maxClose) {
            return 2; // Too much repay
        }
        
        return 0; // Success
    }
}


MOCK ORACLE CONTRACT: 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LendingProtocol.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPriceOracle
 * @notice A simple price oracle for testing and initial deployment
 * @dev This contract allows manual price setting and should be replaced with Chainlink in production
 */
contract MockPriceOracle is IPriceOracle, Ownable {
    /// @notice Mapping of lToken addresses to their underlying asset prices (scaled to 1e18)
    mapping(address => uint256) public prices;
    
    /// @notice Mapping of lToken addresses to when their price was last updated
    mapping(address => uint256) public lastUpdated;
    
    /// @notice Maximum age of a price before it's considered stale (in seconds)
    uint256 public constant MAX_PRICE_AGE = 3600; // 1 hour
    
    /// @notice Emitted when a price is updated
    event PriceUpdated(address indexed lToken, uint256 price, uint256 timestamp);
    
    /// @notice Emitted when multiple prices are updated at once
    event PricesUpdated(address[] lTokens, uint256[] prices, uint256 timestamp);
    
    constructor(address _initialOwner) Ownable(_initialOwner) {}
    
    /**
     * @notice Set the price for a specific lToken
     * @param lToken The address of the lToken
     * @param price The price of the underlying asset (scaled to 1e18)
     */
    function setPrice(address lToken, uint256 price) external onlyOwner {
        require(lToken != address(0), "Invalid lToken address");
        require(price > 0, "Price must be greater than 0");
        
        prices[lToken] = price;
        lastUpdated[lToken] = block.timestamp;
        
        emit PriceUpdated(lToken, price, block.timestamp);
    }
    
    /**
     * @notice Set prices for multiple lTokens at once
     * @param lTokens Array of lToken addresses
     * @param _prices Array of prices (scaled to 1e18)
     */
    function setPrices(
        address[] calldata lTokens, 
        uint256[] calldata _prices
    ) external onlyOwner {
        require(lTokens.length == _prices.length, "Arrays length mismatch");
        require(lTokens.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < lTokens.length; i++) {
            require(lTokens[i] != address(0), "Invalid lToken address");
            require(_prices[i] > 0, "Price must be greater than 0");
            
            prices[lTokens[i]] = _prices[i];
            lastUpdated[lTokens[i]] = block.timestamp;
        }
        
        emit PricesUpdated(lTokens, _prices, block.timestamp);
    }
    
    /**
     * @notice Get the underlying price of an lToken
     * @param lToken The address of the lToken
     * @return The price of the underlying asset (scaled to 1e18)
     */
    function getUnderlyingPrice(address lToken) external view override returns (uint256) {
        uint256 price = prices[lToken];
        require(price > 0, "Price not set");
        
        // Check if price is stale
        uint256 timeSinceUpdate = block.timestamp - lastUpdated[lToken];
        require(timeSinceUpdate <= MAX_PRICE_AGE, "Price is stale");
        
        return price;
    }
    
    /**
     * @notice Get the underlying price without staleness check (for emergency use)
     * @param lToken The address of the lToken
     * @return The price of the underlying asset (scaled to 1e18)
     */
    function getUnderlyingPriceUnsafe(address lToken) external view returns (uint256) {
        return prices[lToken];
    }
    
    /**
     * @notice Check if a price is stale
     * @param lToken The address of the lToken
     * @return true if the price is stale, false otherwise
     */
    function isPriceStale(address lToken) external view returns (bool) {
        if (prices[lToken] == 0) return true;
        uint256 timeSinceUpdate = block.timestamp - lastUpdated[lToken];
        return timeSinceUpdate > MAX_PRICE_AGE;
    }
    
    /**
     * @notice Get the age of a price in seconds
     * @param lToken The address of the lToken
     * @return The age of the price in seconds
     */
    function getPriceAge(address lToken) external view returns (uint256) {
        if (lastUpdated[lToken] == 0) return type(uint256).max;
        return block.timestamp - lastUpdated[lToken];
    }
    
    /**
     * @notice Batch get prices for multiple lTokens
     * @param lTokens Array of lToken addresses
     * @return _prices Array of prices (scaled to 1e18)
     */
    function getPrices(address[] calldata lTokens) external view returns (uint256[] memory _prices) {
        _prices = new uint256[](lTokens.length);
        for (uint256 i = 0; i < lTokens.length; i++) {
            _prices[i] = this.getUnderlyingPrice(lTokens[i]);
        }
    }
    
    /**
     * @notice Emergency function to update a stale price
     * @param lToken The address of the lToken
     * @param price The new price (scaled to 1e18)
     * @dev This function can be used if a price becomes stale and needs immediate update
     */
    function emergencyPriceUpdate(address lToken, uint256 price) external onlyOwner {
        require(lToken != address(0), "Invalid lToken address");
        require(price > 0, "Price must be greater than 0");
        
        // Allow emergency updates even if current price exists
        prices[lToken] = price;
        lastUpdated[lToken] = block.timestamp;
        
        emit PriceUpdated(lToken, price, block.timestamp);
    }
}
