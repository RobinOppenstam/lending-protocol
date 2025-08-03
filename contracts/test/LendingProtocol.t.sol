// test/ComprehensiveLendingTest.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/LendingProtocol.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, 1000000 * 10**decimals_);
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockPriceOracle is IPriceOracle {
    mapping(address => uint256) public prices;
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function setPrice(address lToken, uint256 price) external {
        require(msg.sender == owner, "Only owner");
        prices[lToken] = price;
    }
    
    function getUnderlyingPrice(address lToken) external view override returns (uint256) {
        return prices[lToken];
    }
}

contract ComprehensiveLendingTest is Test {
    // Contracts
    InterestRateModel public interestModel;
    Comptroller public comptroller;
    LToken public lUSDC;
    LToken public lETH;
    LToken public lWBTC;
    MockERC20 public usdc;
    MockERC20 public weth;
    MockERC20 public wbtc;
    MockPriceOracle public oracle;
    
    // Test accounts
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");
    address public liquidator = makeAddr("liquidator");
    address public whale = makeAddr("whale");
    
    // Constants
    uint256 constant INITIAL_BALANCE = 1000000 * 1e18;
    // All prices scaled so that (tokenAmount * price) / 1e18 gives USD value
    uint256 constant USDC_PRICE = 1e12; // $1 per USDC: (1e6 * 1e12) / 1e18 = 1
    uint256 constant ETH_PRICE = 2000; // $2000 per ETH: (1e18 * 2000) / 1e18 = $2000  
    uint256 constant BTC_PRICE = 40000e10; // $40000 per BTC: (1e8 * 40000e10) / 1e18 = $40000
    
    function setUp() public {
        // Deploy tokens with different decimals
        usdc = new MockERC20("USD Coin", "USDC", 6);
        weth = new MockERC20("Wrapped ETH", "WETH", 18);
        wbtc = new MockERC20("Wrapped BTC", "WBTC", 8);
        
        // Deploy oracle
        oracle = new MockPriceOracle();
        
        // Deploy interest rate model with SAFER parameters
        interestModel = new InterestRateModel(
            2e16,    // 2% base rate
            1e17,    // 10% multiplier (REDUCED)
            5e17,    // 50% jump multiplier (REDUCED) 
            8e17     // 80% kink
        );
        
        // Deploy comptroller
        comptroller = new Comptroller(address(this));
        comptroller.setOracle(address(oracle));
        
        // Deploy LTokens
        lUSDC = new LToken(usdc, interestModel, "lUSDC", "lUSDC", address(this));
        lETH = new LToken(weth, interestModel, "lETH", "lETH", address(this));
        lWBTC = new LToken(wbtc, interestModel, "lWBTC", "lWBTC", address(this));
        
        // Setup markets
        comptroller.listMarket(address(lUSDC));
        comptroller.listMarket(address(lETH));
        comptroller.listMarket(address(lWBTC));
        
        // Set comptroller in LTokens
        lUSDC.setComptroller(comptroller);
        lETH.setComptroller(comptroller);
        lWBTC.setComptroller(comptroller);
        
        // Set collateral factors
        lUSDC.setCollateralFactor(0.8e18);  // 80% for stablecoin
        lETH.setCollateralFactor(0.75e18);  // 75% for ETH
        lWBTC.setCollateralFactor(0.7e18);  // 70% for BTC
        
        // Set prices
        oracle.setPrice(address(lUSDC), USDC_PRICE);
        oracle.setPrice(address(lETH), ETH_PRICE);
        oracle.setPrice(address(lWBTC), BTC_PRICE);
        
        // Distribute tokens to test accounts
        _distributeTokens();
        
        // Setup initial liquidity
        _setupInitialLiquidity();
    }
    
    function _distributeTokens() internal {
        address[] memory accounts = new address[](5);
        accounts[0] = alice;
        accounts[1] = bob;
        accounts[2] = charlie;
        accounts[3] = liquidator;
        accounts[4] = whale;
        
        for (uint256 i = 0; i < accounts.length; i++) {
            usdc.mint(accounts[i], 100000 * 1e6);  // 100k USDC
            weth.mint(accounts[i], 1000 * 1e18);   // 1000 ETH
            wbtc.mint(accounts[i], 100 * 1e8);     // 100 BTC
        }
    }
    
    function _setupInitialLiquidity() internal {
        // Whale provides initial liquidity
        vm.startPrank(whale);
        
        usdc.approve(address(lUSDC), 50000 * 1e6);
        lUSDC.supply(50000 * 1e6);
        
        weth.approve(address(lETH), 500 * 1e18);
        lETH.supply(500 * 1e18);
        
        wbtc.approve(address(lWBTC), 50 * 1e8);
        lWBTC.supply(50 * 1e8);
        
        vm.stopPrank();
    }
    
    // ============ BASIC FUNCTIONALITY TESTS ============
    
    function testSupplyBasic() public {
        uint256 supplyAmount = 1000 * 1e6; // 1000 USDC
        
        vm.startPrank(alice);
        usdc.approve(address(lUSDC), supplyAmount);
        
        uint256 balanceBefore = usdc.balanceOf(alice);
        uint256 cashBefore = lUSDC.getCash();
        
        lUSDC.supply(supplyAmount);
        
        assertEq(usdc.balanceOf(alice), balanceBefore - supplyAmount);
        assertGt(lUSDC.accountTokens(alice), 0);
        assertEq(lUSDC.getCash(), cashBefore + supplyAmount);
        vm.stopPrank();
    }
    
    function testSupplyMultipleAssets() public {
        vm.startPrank(alice);
        
        // Supply USDC
        usdc.approve(address(lUSDC), 5000 * 1e6);
        lUSDC.supply(5000 * 1e6);
        
        // Supply ETH
        weth.approve(address(lETH), 10 * 1e18);
        lETH.supply(10 * 1e18);
        
        // Supply BTC
        wbtc.approve(address(lWBTC), 1 * 1e8);
        lWBTC.supply(1 * 1e8);
        
        // Verify all supplies
        assertGt(lUSDC.accountTokens(alice), 0);
        assertGt(lETH.accountTokens(alice), 0);
        assertGt(lWBTC.accountTokens(alice), 0);
        
        vm.stopPrank();
    }
    
    function testBorrowBasic() public {
        uint256 collateralAmount = 10000 * 1e6; // 10k USDC
        uint256 borrowAmount = 1 * 1e18; // 1 ETH ($2k value, well within 80% LTV of $8k)
        
        vm.startPrank(alice);
        
        // Supply collateral
        usdc.approve(address(lUSDC), collateralAmount);
        lUSDC.supply(collateralAmount);
        
        // Debug: Check actual collateral calculation
        (uint256 lTokenBalance, uint256 borrowBalance, uint256 exchangeRate) = lUSDC.getAccountSnapshot(alice);
        // lTokenBalance should be 10000 * 1e6 (10e9)
        // exchangeRate should be 1e18
        // underlyingPrice should be 1e12
        // collateralValue = (10e9 * 1e18 * 1e12) / (1e18 * 1e18) = 10e9 * 1e12 / 1e18 = 10e3 = 10000 USD scaled
        // With 80% collateral factor: 10000 * 0.8 = 8000 USD borrowing power
        
        // Enter markets
        address[] memory markets = new address[](2);
        markets[0] = address(lUSDC);
        markets[1] = address(lETH);
        comptroller.enterMarkets(markets);
        
        // Check borrowing capacity
        (uint256 liquidity,) = comptroller.getAccountLiquidity(alice);
        // Should be about 8000 * some scale factor
        assertGt(liquidity, 0);
        
        // Borrow
        uint256 ethBalanceBefore = weth.balanceOf(alice);
        lETH.borrow(borrowAmount);
        
        assertEq(weth.balanceOf(alice), ethBalanceBefore + borrowAmount);
        assertEq(lETH.borrowBalanceStored(alice), borrowAmount);
        
        vm.stopPrank();
    }
    
    function testRepayBorrow() public {
        // Setup borrow position first
        _setupBorrowPosition(alice, 5000 * 1e6, 1.5 * 1e18); // Reduced to stay within LTV
        
        vm.startPrank(alice);
        
        uint256 repayAmount = 1 * 1e18; // Repay 1 ETH
        uint256 borrowBalanceBefore = lETH.borrowBalanceStored(alice);
        
        weth.approve(address(lETH), repayAmount);
        lETH.repayBorrow(repayAmount);
        
        uint256 borrowBalanceAfter = lETH.borrowBalanceStored(alice);
        assertEq(borrowBalanceAfter, borrowBalanceBefore - repayAmount);
        
        vm.stopPrank();
    }
    
    function testRedeemBasic() public {
        uint256 supplyAmount = 1000 * 1e6;
        
        vm.startPrank(alice);
        
        // Supply first
        usdc.approve(address(lUSDC), supplyAmount);
        lUSDC.supply(supplyAmount);
        
        uint256 lTokenBalance = lUSDC.accountTokens(alice);
        uint256 redeemTokens = lTokenBalance / 2; // Redeem half
        
        uint256 usdcBalanceBefore = usdc.balanceOf(alice);
        lUSDC.redeem(redeemTokens);
        
        assertEq(lUSDC.accountTokens(alice), lTokenBalance - redeemTokens);
        assertGt(usdc.balanceOf(alice), usdcBalanceBefore);
        
        vm.stopPrank();
    }
    
    // ============ EDGE CASE TESTS ============
    
    function testSupplyZeroAmount() public {
        vm.startPrank(alice);
        usdc.approve(address(lUSDC), 1);
        
        vm.expectRevert("Supply amount must be greater than 0");
        lUSDC.supply(0);
        
        vm.stopPrank();
    }
    
    function testBorrowWithoutCollateral() public {
        vm.startPrank(alice);
        
        address[] memory markets = new address[](1);
        markets[0] = address(lETH);
        comptroller.enterMarkets(markets);
        
        vm.expectRevert("Comptroller rejection");
        lETH.borrow(1 * 1e18);
        
        vm.stopPrank();
    }
    
    function testBorrowExceedsCapacity() public {
        uint256 collateralAmount = 1000 * 1e6; // $1000 USDC
        uint256 excessiveBorrow = 10 * 1e18; // $20k ETH (exceeds 80% LTV)
        
        vm.startPrank(alice);
        
        usdc.approve(address(lUSDC), collateralAmount);
        lUSDC.supply(collateralAmount);
        
        address[] memory markets = new address[](2);
        markets[0] = address(lUSDC);
        markets[1] = address(lETH);
        comptroller.enterMarkets(markets);
        
        vm.expectRevert("Comptroller rejection");
        lETH.borrow(excessiveBorrow);
        
        vm.stopPrank();
    }
    
    function testRedeemExceedsBalance() public {
        uint256 supplyAmount = 1000 * 1e6;
        
        vm.startPrank(alice);
        
        usdc.approve(address(lUSDC), supplyAmount);
        lUSDC.supply(supplyAmount);
        
        uint256 excessiveRedeem = lUSDC.accountTokens(alice) + 1;
        
        vm.expectRevert("Insufficient balance");
        lUSDC.redeem(excessiveRedeem);
        
        vm.stopPrank();
    }
    
    function testRedeemWithActiveBorrow() public {
        // Setup position with both supply and borrow
        _setupBorrowPosition(alice, 5000 * 1e6, 1.5 * 1e18); // Within LTV: $5k collateral, $3k borrow
        
        vm.startPrank(alice);
        
        uint256 allTokens = lUSDC.accountTokens(alice);
        
        // Trying to redeem all collateral should fail
        vm.expectRevert("Comptroller rejection");
        lUSDC.redeem(allTokens);
        
        vm.stopPrank();
    }
    
    // ============ INTEREST RATE TESTS ============
    
    function testInterestAccrualBasic() public {
        _setupBorrowPosition(alice, 10000 * 1e6, 3 * 1e18); // Reduced to stay within LTV
        
        uint256 borrowBalanceBefore = lETH.borrowBalanceStored(alice);
        
        // Fast forward blocks
        vm.roll(block.number + 1000);
        
        // Accrue interest
        lETH.accrueInterest();
        
        uint256 borrowBalanceAfter = lETH.borrowBalanceStored(alice);
        assertGt(borrowBalanceAfter, borrowBalanceBefore);
        
        // Interest should be reasonable (not explosive)
        uint256 interestAccrued = borrowBalanceAfter - borrowBalanceBefore;
        assertLt(interestAccrued, borrowBalanceBefore / 10); // Less than 10% increase
    }
    
    function testInterestRateModel() public {
        // Test at different utilization rates
        uint256 cash = 100000 * 1e18;
        uint256 reserves = 0;
        
        // Low utilization (10%)
        uint256 lowUtilBorrows = 10000 * 1e18;
        uint256 lowRate = interestModel.getBorrowRate(cash, lowUtilBorrows, reserves);
        
        // High utilization (90%)  
        uint256 highUtilBorrows = 90000 * 1e18;
        uint256 highRate = interestModel.getBorrowRate(cash, highUtilBorrows, reserves);
        
        // High utilization should have higher rate
        assertGt(highRate, lowRate);
        
        // Rates should be reasonable (less than 100% annual)
        assertLt(lowRate, 1e18);
        assertLt(highRate, 1e18);
    }
    
    function testExchangeRateStability() public {
        uint256 initialRate = lUSDC.exchangeRateStored();
        assertEq(initialRate, 1e18); // Should start at 1:1
        
        // Supply some tokens
        vm.startPrank(alice);
        usdc.approve(address(lUSDC), 10000 * 1e6);
        lUSDC.supply(10000 * 1e6);
        vm.stopPrank();
        
        uint256 rateAfterSupply = lUSDC.exchangeRateStored();
        
        // Rate should still be exactly 1:1 after supply (no interest accrued yet)
        assertEq(rateAfterSupply, 1e18);
        
        // Create some borrows to generate interest
        vm.startPrank(bob);
        usdc.approve(address(lUSDC), 5000 * 1e6);
        lUSDC.supply(5000 * 1e6);
        
        address[] memory markets = new address[](2);
        markets[0] = address(lUSDC);
        markets[1] = address(lETH);
        comptroller.enterMarkets(markets);
        
        lETH.borrow(1 * 1e18); // Borrow 1 ETH
        vm.stopPrank();
        
        // Fast forward and accrue some interest
        vm.roll(block.number + 1000);
        lUSDC.accrueInterest();
        
        uint256 rateAfterInterest = lUSDC.exchangeRateStored();
        
        // With no borrows against USDC itself, rate should remain stable
        // (Interest only accrues to lToken holders when their underlying asset is borrowed)
        assertEq(rateAfterInterest, rateAfterSupply);
        assertLt(rateAfterInterest, 5e18); // Should not exceed 5x initial rate
    }
    
    // ============ LIQUIDATION TESTS ============
    
    function testLiquidationBasic() public {
        // Setup liquidatable position
        _setupLiquidatablePosition();
        
        vm.startPrank(liquidator);
        
        uint256 repayAmount = 1 * 1e18; // Repay 1 ETH
        weth.approve(address(lETH), repayAmount);
        
        uint256 liquidatorUSDCBefore = lUSDC.accountTokens(liquidator);
        uint256 borrowerUSDCBefore = lUSDC.accountTokens(alice);
        
        // Execute liquidation
        lETH.liquidateBorrow(alice, repayAmount, address(lUSDC));
        
        // Liquidator should receive collateral
        assertGt(lUSDC.accountTokens(liquidator), liquidatorUSDCBefore);
        
        // Borrower should lose collateral
        assertLt(lUSDC.accountTokens(alice), borrowerUSDCBefore);
        
        vm.stopPrank();
    }
    
    function testLiquidationIncentive() public {
        _setupLiquidatablePosition();
        
        vm.startPrank(liquidator);
        
        uint256 repayAmount = 1 * 1e18;
        weth.approve(address(lETH), repayAmount);
        
        uint256 seizeTokens = comptroller.liquidateCalculateSeizeTokens(
            address(lETH),
            address(lUSDC),
            repayAmount
        );
        
        // Calculate expected value with incentive
        uint256 repayValueUSD = (repayAmount * 2600) / 1e18; // 1 ETH = $2600, scale down from wei
        uint256 expectedSeizeValueUSD = (repayValueUSD * 1.08e18) / 1e18; // 8% incentive
        
        lETH.liquidateBorrow(alice, repayAmount, address(lUSDC));
        
        // Verify liquidator received incentive
        // seizeTokens is in lUSDC units, convert to USD value
        uint256 actualSeizeValueUSD = (seizeTokens * lUSDC.exchangeRateStored() * USDC_PRICE) / (1e18 * 1e18);
        // Scale expected value to match the actual calculation precision
        uint256 scaledExpectedValue = expectedSeizeValueUSD;
        assertApproxEqRel(actualSeizeValueUSD, scaledExpectedValue, 5e16); // Within 5%
        
        vm.stopPrank();
    }
    
    function testCannotLiquidateHealthyPosition() public {
        _setupBorrowPosition(alice, 10000 * 1e6, 2 * 1e18); // Conservative position
        
        vm.startPrank(liquidator);
        
        weth.approve(address(lETH), 1 * 1e18);
        
        vm.expectRevert("Liquidation not allowed");
        lETH.liquidateBorrow(alice, 1 * 1e18, address(lUSDC));
        
        vm.stopPrank();
    }
    
    function testLiquidationCloseFactor() public {
        _setupLiquidatablePosition();
        
        vm.startPrank(liquidator);
        
        uint256 totalDebt = lETH.borrowBalanceStored(alice);
        uint256 maxRepay = (totalDebt * comptroller.closeFactorMantissa()) / 1e18;
        uint256 excessiveRepay = maxRepay + 1;
        
        weth.approve(address(lETH), excessiveRepay);
        
        vm.expectRevert("Too much repay");
        lETH.liquidateBorrow(alice, excessiveRepay, address(lUSDC));
        
        vm.stopPrank();
    }
    
    // ============ COMBINATION TESTS ============
    
    function testMultipleUsersBorrowSameAsset() public {
        // Alice borrows
        _setupBorrowPosition(alice, 5000 * 1e6, 1.5 * 1e18); // Within LTV
        
        // Bob borrows
        _setupBorrowPosition(bob, 8000 * 1e6, 2.5 * 1e18); // Within LTV
        
        // Charlie borrows
        _setupBorrowPosition(charlie, 12000 * 1e6, 3.5 * 1e18); // Within LTV
        
        // Verify all positions
        assertGt(lETH.borrowBalanceStored(alice), 0);
        assertGt(lETH.borrowBalanceStored(bob), 0);
        assertGt(lETH.borrowBalanceStored(charlie), 0);
        
        // Total borrows should be sum of individual borrows
        uint256 expectedTotal = lETH.borrowBalanceStored(alice) + 
                               lETH.borrowBalanceStored(bob) + 
                               lETH.borrowBalanceStored(charlie);
        
        assertApproxEqAbs(lETH.totalBorrows(), expectedTotal, 1e15); // Allow small rounding
    }
    
    function testCrossAssetBorrowing() public {
        vm.startPrank(alice);
        
        // Supply multiple collaterals
        usdc.approve(address(lUSDC), 10000 * 1e6);
        lUSDC.supply(10000 * 1e6);
        
        weth.approve(address(lETH), 10 * 1e18);
        lETH.supply(10 * 1e18);
        
        // Enter all markets
        address[] memory markets = new address[](3);
        markets[0] = address(lUSDC);
        markets[1] = address(lETH);
        markets[2] = address(lWBTC);
        comptroller.enterMarkets(markets);
        
        // Borrow different asset (BTC)
        lWBTC.borrow(0.5 * 1e8); // 0.5 BTC
        
        assertEq(lWBTC.borrowBalanceStored(alice), 0.5 * 1e8);
        
        vm.stopPrank();
    }
    
    function testComplexScenario() public {
        // Complex scenario: Multiple users, multiple assets, liquidations
        
        // Setup multiple positions
        _setupBorrowPosition(alice, 20000 * 1e6, 6 * 1e18); // Within LTV at $2000 ETH, liquidatable at $3500
        _setupBorrowPosition(bob, 20000 * 1e6, 3 * 1e18); // More conservative - should remain healthy
        
        // Accrue some interest
        vm.roll(block.number + 2000);
        lETH.accrueInterest();
        lUSDC.accrueInterest();
        
        // Change prices to create liquidation opportunity
        oracle.setPrice(address(lETH), 3500); // ETH pumps to $3500 (makes 6 ETH worth $21k > $20k collateral)
        
        // Alice's position should be liquidatable
        (, uint256 shortfall) = comptroller.getAccountLiquidity(alice);
        assertGt(shortfall, 0);
        
        // Bob's position should still be healthy
        (uint256 liquidity,) = comptroller.getAccountLiquidity(bob);
        assertGt(liquidity, 0);
        
        // Liquidate Alice
        vm.startPrank(liquidator);
        weth.approve(address(lETH), 3 * 1e18);
        lETH.liquidateBorrow(alice, 3 * 1e18, address(lUSDC));
        vm.stopPrank();
        
        // Verify liquidation worked
        assertLt(lETH.borrowBalanceStored(alice), 6 * 1e18);
        assertGt(lUSDC.accountTokens(liquidator), 0);
    }
    
    // ============ HELPER FUNCTIONS ============
    
    function _setupBorrowPosition(address user, uint256 collateralAmount, uint256 borrowAmount) internal {
        vm.startPrank(user);
        
        usdc.approve(address(lUSDC), collateralAmount);
        lUSDC.supply(collateralAmount);
        
        address[] memory markets = new address[](2);
        markets[0] = address(lUSDC);
        markets[1] = address(lETH);
        comptroller.enterMarkets(markets);
        
        lETH.borrow(borrowAmount);
        
        vm.stopPrank();
    }
    
    function _setupLiquidatablePosition() internal {
        // Alice supplies and borrows aggressively
        _setupBorrowPosition(alice, 10000 * 1e6, 3.9 * 1e18); // $10k collateral, $7.8k borrow (78% LTV)
        
        // Increase ETH price to make position liquidatable
        oracle.setPrice(address(lETH), 2600); // ETH to $2600 (makes 3.9 ETH worth $10.14k > $10k collateral)
        
        // Verify position is liquidatable
        (, uint256 shortfall) = comptroller.getAccountLiquidity(alice);
        assertGt(shortfall, 0);
    }
}