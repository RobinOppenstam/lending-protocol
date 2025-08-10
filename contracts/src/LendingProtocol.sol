// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Interest Rate Model Contract - FIXED VERSION
contract InterestRateModel {
    uint256 public constant BLOCKS_PER_YEAR = 2628000; // ~12 sec blocks
    uint256 private constant BASE = 1e18;
    uint256 private constant MAX_BORROW_RATE = 1e18; // 100% max annual rate
    
    // Interest rate model parameters
    uint256 public baseRatePerYear;
    uint256 public multiplierPerYear;
    uint256 public jumpMultiplierPerYear;
    uint256 public kink;
    
    constructor(
        uint256 _baseRatePerYear,      // 2% = 2e16
        uint256 _multiplierPerYear,    // 8% = 8e16 (FURTHER REDUCED for safety)
        uint256 _jumpMultiplierPerYear, // 20% = 2e17 (SIGNIFICANTLY REDUCED for safety)
        uint256 _kink                  // 80% = 8e17
    ) {
        require(_baseRatePerYear <= 5e16, "Base rate too high"); // Max 5%
        require(_multiplierPerYear <= 15e16, "Multiplier too high"); // Max 15%
        require(_jumpMultiplierPerYear <= 3e17, "Jump multiplier too high"); // Max 30%
        require(_kink <= 9e17, "Kink too high"); // Max 90%
        
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
        uint256 totalSupply = cash + borrows - reserves;
        if (totalSupply == 0) return 0;
        return (borrows * BASE) / totalSupply;
    }
    
    function getBorrowRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves
    ) public view returns (uint256) {
        uint256 util = utilizationRate(cash, borrows, reserves);
        
        uint256 borrowRate;
        if (util <= kink) {
            borrowRate = (util * multiplierPerYear) / BASE + baseRatePerYear;
        } else {
            uint256 normalRate = (kink * multiplierPerYear) / BASE + baseRatePerYear;
            uint256 excessUtil = util - kink;
            borrowRate = (excessUtil * jumpMultiplierPerYear) / BASE + normalRate;
        }
        
        // SAFETY CHECK: Cap the borrow rate at maximum
        return borrowRate > MAX_BORROW_RATE ? MAX_BORROW_RATE : borrowRate;
    }
    
    function getBorrowRatePerBlock(
        uint256 cash,
        uint256 borrows,
        uint256 reserves
    ) public view returns (uint256) {
        uint256 borrowRatePerYear = getBorrowRate(cash, borrows, reserves);
        return borrowRatePerYear / BLOCKS_PER_YEAR;
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
    
    function getSupplyRatePerBlock(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactorMantissa
    ) public view returns (uint256) {
        uint256 supplyRatePerYear = getSupplyRate(cash, borrows, reserves, reserveFactorMantissa);
        return supplyRatePerYear / BLOCKS_PER_YEAR;
    }
}

// Price Oracle Interface
interface IPriceOracle {
    function getUnderlyingPrice(address lToken) external view returns (uint256);
}

// LToken Contract (represents deposited assets) - FIXED VERSION
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
    
    // Market state
    uint256 public totalSupply;
    uint256 public totalBorrows;
    uint256 public totalReserves;
    uint256 public borrowIndex = 1e18;
    uint256 public accrualBlockNumber;
    uint256 public supplyIndex = 1e18; // Track supply index for interest distribution
    
    // ENHANCED SAFETY LIMITS
    uint256 private constant MAX_BORROW_RATE_PER_BLOCK = 5e12; // 0.0005% per block max (~13% annual)
    uint256 private constant MAX_EXCHANGE_RATE = 3e18; // 3x initial rate max for testing
    uint256 private constant MAX_INTEREST_FACTOR = 1e15; // 0.1% max interest per accrual
    
    mapping(address => uint256) public accountTokens;
    mapping(address => uint256) public accountBorrows;
    mapping(address => uint256) public borrowBalanceSnapshots;
    mapping(address => uint256) public supplyBalanceSnapshots; // Track supply snapshots
    
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
    event AccrueInterest(
        uint256 cashPrior,
        uint256 interestAccumulated,
        uint256 borrowIndex,
        uint256 totalBorrows
    );
    event Transfer(address indexed from, address indexed to, uint256 amount);
    
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
    
    // FIXED INTEREST ACCRUAL FUNCTION
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
        
        // Get SAFE borrow rate per block
        uint256 borrowRatePerBlock = interestRateModel.getBorrowRatePerBlock(
            cashPrior,
            borrowsPrior,
            reservesPrior
        );
        
        // SAFETY CHECK: Cap the rate per block
        if (borrowRatePerBlock > MAX_BORROW_RATE_PER_BLOCK) {
            borrowRatePerBlock = MAX_BORROW_RATE_PER_BLOCK;
        }
        
        uint256 blockDelta = currentBlockNumber - accrualBlockNumberPrior;
        
        // SAFETY CHECK: Cap block delta to prevent extreme accruals
        if (blockDelta > 50400) { // ~1 week of blocks
            blockDelta = 50400;
        }
        
        // Calculate simple interest (not compound for safety)
        uint256 simpleInterestFactor = borrowRatePerBlock * blockDelta;
        
        // ENHANCED SAFETY: Cap the interest factor to prevent exchange rate explosion
        if (simpleInterestFactor > MAX_INTEREST_FACTOR) {
            simpleInterestFactor = MAX_INTEREST_FACTOR;
        }
        
        uint256 interestAccumulated = (simpleInterestFactor * borrowsPrior) / 1e18;
        
        // Update market state
        totalBorrows = borrowsPrior + interestAccumulated;
        totalReserves = reservesPrior + (interestAccumulated * reserveFactorMantissa) / 1e18;
        borrowIndex = borrowIndexPrior + (simpleInterestFactor * borrowIndexPrior) / 1e18;
        accrualBlockNumber = currentBlockNumber;
        
        emit AccrueInterest(cashPrior, interestAccumulated, borrowIndex, totalBorrows);
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
        supplyBalanceSnapshots[msg.sender] = supplyIndex; // Track supply snapshot
        
        emit Supply(msg.sender, actualSupplyAmount, mintTokens);
        return 0;
    }
    
    function redeem(uint256 redeemTokens) external nonReentrant returns (uint256) {
        accrueInterest();
        
        uint256 exchangeRate = exchangeRateStored();
        uint256 redeemAmount = (redeemTokens * exchangeRate) / 1e18;
        
        require(accountTokens[msg.sender] >= redeemTokens, "Insufficient balance");
        require(getCash() >= redeemAmount, "Insufficient cash");
        
        // Check if withdrawal is allowed by comptroller
        if (address(comptroller) != address(0)) {
            uint256 allowed = comptroller.redeemAllowed(address(this), msg.sender, redeemTokens);
            require(allowed == 0, "Comptroller rejection");
        }
        
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
    
    // LIQUIDATION FUNCTION
    function liquidateBorrow(
        address borrower,
        uint256 repayAmount,
        address lTokenCollateral
    ) external nonReentrant returns (uint256) {
        accrueInterest();
        LToken(lTokenCollateral).accrueInterest();
        
        // Check if liquidation is allowed
        uint256 allowed = comptroller.liquidateBorrowAllowed(
            address(this),
            lTokenCollateral,
            msg.sender,
            borrower,
            repayAmount
        );
        if (allowed == 1) {
            revert("Liquidation not allowed");
        } else if (allowed == 2) {
            revert("Too much repay");
        }
        require(allowed == 0, "Liquidation failed");
        
        // Calculate seize tokens
        uint256 seizeTokens = comptroller.liquidateCalculateSeizeTokens(
            address(this),
            lTokenCollateral,
            repayAmount
        );
        
        require(seizeTokens > 0, "Invalid seize amount");
        
        // Execute repayment
        uint256 actualRepayAmount = doTransferIn(msg.sender, repayAmount);
        
        // Update borrower's debt
        uint256 borrowBalancePrev = borrowBalanceStored(borrower);
        require(borrowBalancePrev >= actualRepayAmount, "Repay amount too high");
        
        uint256 borrowBalanceNew = borrowBalancePrev - actualRepayAmount;
        
        totalBorrows -= actualRepayAmount;
        accountBorrows[borrower] = borrowBalanceNew;
        borrowBalanceSnapshots[borrower] = borrowIndex;
        
        // Seize collateral
        LToken(lTokenCollateral).seize(msg.sender, borrower, seizeTokens);
        
        emit LiquidateBorrow(
            msg.sender,
            borrower,
            actualRepayAmount,
            lTokenCollateral,
            seizeTokens
        );
        
        return 0;
    }
    
    // SEIZE FUNCTION FOR LIQUIDATIONS
    function seize(
        address liquidator,
        address borrower,
        uint256 seizeTokens
    ) external nonReentrant {
        require(msg.sender != address(this), "Cannot seize own tokens");
        require(comptroller.isListed(msg.sender), "Market not listed");
        
        require(accountTokens[borrower] >= seizeTokens, "Insufficient collateral");
        
        // Transfer lTokens from borrower to liquidator
        accountTokens[borrower] -= seizeTokens;
        accountTokens[liquidator] += seizeTokens;
        
        emit Transfer(borrower, liquidator, seizeTokens);
    }
    
    // View functions
    function exchangeRateStored() public view returns (uint256) {
        if (totalSupply == 0) {
            return 1e18; // Initial exchange rate
        }
        
        uint256 totalCash = getCash();
        uint256 cashPlusBorrowsMinusReserves = totalCash + totalBorrows - totalReserves;
        uint256 exchangeRate = (cashPlusBorrowsMinusReserves * 1e18) / totalSupply;
        
        // SAFETY CHECK: Cap exchange rate to prevent explosions
        return exchangeRate > MAX_EXCHANGE_RATE ? MAX_EXCHANGE_RATE : exchangeRate;
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
    
    // Emergency function to reset interest accrual if needed
    function resetAccrualBlock() external onlyOwner {
        accrualBlockNumber = block.number;
    }
}

// Comptroller Contract (Risk Management) - ENHANCED VERSION
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
    event NewPriceOracle(address oldOracle, address newOracle);
    event NewCloseFactor(uint256 oldCloseFactor, uint256 newCloseFactor);
    event NewLiquidationIncentive(uint256 oldIncentive, uint256 newIncentive);
    
    constructor(address _initialOwner) Ownable(_initialOwner) {}
    
    function setOracle(address _oracle) external onlyOwner {
        address oldOracle = address(oracle);
        oracle = IPriceOracle(_oracle);
        emit NewPriceOracle(oldOracle, _oracle);
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
    ) external returns (uint256) {
        require(markets[lToken], "Market not listed");
        
        if (!accountMembership[borrower][lToken]) {
            // Auto-enter market for borrower
            accountMembership[borrower][lToken] = true;
            accountAssets[borrower].push(lToken);
            emit MarketEntered(lToken, borrower);
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
    
    function redeemAllowed(
        address lToken,
        address redeemer,
        uint256 redeemTokens
    ) external returns (uint256) {
        // Auto-enter market if not already in
        if (!accountMembership[redeemer][lToken]) {
            accountMembership[redeemer][lToken] = true;
            accountAssets[redeemer].push(lToken);
            emit MarketEntered(lToken, redeemer);
        }
        
        (uint256 sumCollateral, uint256 sumBorrowPlusEffects) = getHypotheticalAccountLiquidity(
            redeemer,
            lToken,
            redeemTokens,
            0
        );
        
        uint256 shortfall;
        if (sumCollateral >= sumBorrowPlusEffects) {
            shortfall = 0;
        } else {
            shortfall = sumBorrowPlusEffects - sumCollateral;
        }
        
        if (shortfall > 0) {
            return 1; // Insufficient liquidity
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
    
    function liquidateCalculateSeizeTokens(
        address lTokenBorrowed,
        address lTokenCollateral,
        uint256 actualRepayAmount
    ) external view returns (uint256) {
        // Get prices from oracle
        uint256 priceBorrowed = oracle.getUnderlyingPrice(lTokenBorrowed);
        uint256 priceCollateral = oracle.getUnderlyingPrice(lTokenCollateral);
        
        require(priceBorrowed > 0 && priceCollateral > 0, "Invalid prices");
        
        // Get exchange rate of collateral
        uint256 exchangeRate = LToken(lTokenCollateral).exchangeRateStored();
        
        // Calculate seize amount with liquidation incentive
        // seizeAmount = actualRepayAmount * liquidationIncentive * priceBorrowed / priceCollateral
        uint256 numerator = actualRepayAmount * (1e18 + liquidationIncentiveMantissa) * priceBorrowed;
        uint256 denominator = priceCollateral * exchangeRate;
        
        return numerator / denominator;
    }
    
    function isListed(address lToken) external view returns (bool) {
        return markets[lToken];
    }
    
    // Admin functions
    function setCloseFactor(uint256 newCloseFactorMantissa) external onlyOwner {
        require(newCloseFactorMantissa >= 0.05e18 && newCloseFactorMantissa <= 0.9e18, "Invalid close factor");
        uint256 oldCloseFactor = closeFactorMantissa;
        closeFactorMantissa = newCloseFactorMantissa;
        emit NewCloseFactor(oldCloseFactor, newCloseFactorMantissa);
    }
    
    function setLiquidationIncentive(uint256 newLiquidationIncentiveMantissa) external onlyOwner {
        require(newLiquidationIncentiveMantissa >= 1e18 && newLiquidationIncentiveMantissa <= 1.5e18, "Invalid liquidation incentive");
        uint256 oldIncentive = liquidationIncentiveMantissa;
        liquidationIncentiveMantissa = newLiquidationIncentiveMantissa;
        emit NewLiquidationIncentive(oldIncentive, newLiquidationIncentiveMantissa);
    }
}