// test/ChainlinkPriceOracle.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/ChainlinkPriceOracle.sol";
import "../src/mocks/MockAggregatorV3.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock lToken for testing
contract MockLToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
}

contract ChainlinkPriceOracleTest is Test {
    ChainlinkPriceOracle public oracle;
    MockAggregatorV3 public ethPriceFeed;
    MockAggregatorV3 public usdcPriceFeed;
    MockLToken public lETH;
    MockLToken public lUSDC;
    
    address public owner = address(this);
    address public user = address(0x1234);
    
    // Price feed decimals
    uint8 constant ETH_DECIMALS = 8;
    uint8 constant USDC_DECIMALS = 8;
    
    // Initial prices (with 8 decimals)
    int256 constant ETH_PRICE = 2000 * 10**8; // $2000 with 8 decimals = 200,000,000,000
    int256 constant USDC_PRICE = 1 * 10**8;   // $1 with 8 decimals = 100,000,000
    
    function setUp() public {
        // Deploy oracle
        oracle = new ChainlinkPriceOracle(owner);
        
        // Deploy mock lTokens
        lETH = new MockLToken("Lending ETH", "lETH");
        lUSDC = new MockLToken("Lending USDC", "lUSDC");
        
        // Deploy mock price feeds
        ethPriceFeed = new MockAggregatorV3(ETH_DECIMALS, ETH_PRICE);
        usdcPriceFeed = new MockAggregatorV3(USDC_DECIMALS, USDC_PRICE);
        
        // Set up price feeds
        oracle.setPriceFeed(address(lETH), address(ethPriceFeed));
        oracle.setPriceFeed(address(lUSDC), address(usdcPriceFeed));
    }
    
    // === Basic Functionality Tests ===
    
    function testSetPriceFeed() public {
        MockLToken newToken = new MockLToken("New Token", "NEW");
        MockAggregatorV3 newFeed = new MockAggregatorV3(8, 100 * 10**8);
        
        oracle.setPriceFeed(address(newToken), address(newFeed));
        
        assertEq(address(oracle.priceFeeds(address(newToken))), address(newFeed));
        assertEq(oracle.feedDecimals(address(newToken)), 8);
    }
    
    function testSetPriceFeedZeroAddress() public {
        vm.expectRevert("Invalid lToken address");
        oracle.setPriceFeed(address(0), address(ethPriceFeed));
        
        vm.expectRevert("Invalid price feed address");
        oracle.setPriceFeed(address(lETH), address(0));
    }
    
    function testSetPriceFeedNonOwner() public {
        vm.prank(user);
        vm.expectRevert();
        oracle.setPriceFeed(address(lETH), address(ethPriceFeed));
    }
    
    // === Price Retrieval Tests ===
    
    function testGetUnderlyingPrice() public view {
        uint256 ethPrice = oracle.getUnderlyingPrice(address(lETH));
        uint256 usdcPrice = oracle.getUnderlyingPrice(address(lUSDC));
        
        // Prices should be scaled to 18 decimals
        assertEq(ethPrice, 2000 * 10**18); // $2000
        assertEq(usdcPrice, 1 * 10**18); // $1
    }
    
    function testGetUnderlyingPriceNoFeed() public {
        MockLToken newToken = new MockLToken("New Token", "NEW");
        
        vm.expectRevert("Price feed not set");
        oracle.getUnderlyingPrice(address(newToken));
    }
    
    function testGetUnderlyingPriceStale() public {
        // Make price stale (older than 1 hour)
        vm.warp(block.timestamp + 3601);
        
        vm.expectRevert("Chainlink price too stale");
        oracle.getUnderlyingPrice(address(lETH));
    }
    
    function testGetUnderlyingPriceNegative() public {
        ethPriceFeed.setPrice(-100);
        
        vm.expectRevert("Invalid price from Chainlink");
        oracle.getUnderlyingPrice(address(lETH));
    }
    
    function testGetUnderlyingPriceOutOfBounds() public {
        // Test price too low (MIN_PRICE is 1e15, so with 8 decimals we need < 1e5)
        ethPriceFeed.setPrice(100); // Way below minimum when scaled to 18 decimals
        vm.expectRevert("Price out of bounds");
        oracle.getUnderlyingPrice(address(lETH));
        
        // Test price too high (MAX_PRICE is 1e24, so with 8 decimals we need > 1e14)
        ethPriceFeed.setPrice(int256(2e14)); // Above maximum when scaled to 18 decimals
        vm.expectRevert("Price out of bounds");
        oracle.getUnderlyingPrice(address(lETH));
    }
    
    // === Decimal Scaling Tests ===
    
    function testDecimalScaling() public {
        // Test with different decimal feeds
        MockAggregatorV3 feed6Decimals = new MockAggregatorV3(6, 2000 * 10**6);
        MockAggregatorV3 feed18Decimals = new MockAggregatorV3(18, 2000 * 10**18);
        
        MockLToken token6 = new MockLToken("Token6", "T6");
        MockLToken token18 = new MockLToken("Token18", "T18");
        
        oracle.setPriceFeed(address(token6), address(feed6Decimals));
        oracle.setPriceFeed(address(token18), address(feed18Decimals));
        
        // All should return same price in 18 decimals
        assertEq(oracle.getUnderlyingPrice(address(token6)), 2000000000000000000000);
        assertEq(oracle.getUnderlyingPrice(address(token18)), 2000000000000000000000);
        
        // Test with too many decimals (should fail during setPriceFeed)
        MockAggregatorV3 feed20Decimals = new MockAggregatorV3(20, 2000 * 10**20);
        MockLToken token20 = new MockLToken("Token20", "T20");
        
        vm.expectRevert("Too many decimals");
        oracle.setPriceFeed(address(token20), address(feed20Decimals));
    }
    
    // === Emergency Price Tests ===
    
    function testSetEmergencyPrice() public {
        uint256 emergencyPrice = 1500 * 10**18;
        oracle.setEmergencyPrice(address(lETH), emergencyPrice);
        
        assertEq(oracle.emergencyPrices(address(lETH)), emergencyPrice);
    }
    
    function testSetEmergencyPriceZero() public {
        vm.expectRevert("Price must be greater than 0");
        oracle.setEmergencyPrice(address(lETH), 0);
    }
    
    function testSetEmergencyPriceOutOfBounds() public {
        // MIN_PRICE is 1e15
        vm.expectRevert("Price out of bounds");
        oracle.setEmergencyPrice(address(lETH), 1e14); // Below minimum
        
        // MAX_PRICE is 1e24  
        vm.expectRevert("Price out of bounds");
        oracle.setEmergencyPrice(address(lETH), 1e25); // Above maximum
    }
    
    function testEmergencyMode() public {
        uint256 emergencyPrice = 1500 * 10**18;
        oracle.setEmergencyPrice(address(lETH), emergencyPrice);
        oracle.setEmergencyMode(address(lETH), true);
        
        assertTrue(oracle.useEmergencyPrice(address(lETH)));
        assertEq(oracle.getUnderlyingPrice(address(lETH)), emergencyPrice);
    }
    
    function testEmergencyModeNoPriceSet() public {
        vm.expectRevert("Emergency price not set");
        oracle.setEmergencyMode(address(lETH), true);
    }
    
    function testPausePriceFeed() public {
        uint256 emergencyPrice = 1500 * 10**18;
        oracle.pausePriceFeed(address(lETH), emergencyPrice);
        
        assertTrue(oracle.useEmergencyPrice(address(lETH)));
        assertEq(oracle.getUnderlyingPrice(address(lETH)), emergencyPrice);
    }
    
    function testResumePriceFeed() public {
        // First pause
        oracle.pausePriceFeed(address(lETH), 1500000000000000000000);
        assertTrue(oracle.useEmergencyPrice(address(lETH)));
        
        // Then resume
        oracle.resumePriceFeed(address(lETH));
        assertFalse(oracle.useEmergencyPrice(address(lETH)));
        
        // Should use normal price feed again
        assertEq(oracle.getUnderlyingPrice(address(lETH)), 2000000000000000000000);
    }
    
    function testResumePriceFeedStale() public {
        oracle.pausePriceFeed(address(lETH), 1500 * 10**18);
        
        // Make price feed stale
        vm.warp(block.timestamp + 3601);
        
        vm.expectRevert("Price feed still stale");
        oracle.resumePriceFeed(address(lETH));
    }
    
    // === Price Metadata Tests ===
    
    function testGetPriceWithMetadata() public view {
        (uint256 price, uint256 updatedAt, bool isStale) = oracle.getPriceWithMetadata(address(lETH));
        
        assertEq(price, 2000000000000000000000); // 2000 * 10^18
        assertEq(updatedAt, block.timestamp);
        assertFalse(isStale);
    }
    
    function testGetPriceWithMetadataStale() public {
        uint256 oldTimestamp = block.timestamp;
        vm.warp(block.timestamp + 3601);
        
        (uint256 price, uint256 updatedAt, bool isStale) = oracle.getPriceWithMetadata(address(lETH));
        
        assertEq(price, 2000000000000000000000); // 2000 * 10^18
        assertEq(updatedAt, oldTimestamp);
        assertTrue(isStale);
    }
    
    function testGetPriceWithMetadataEmergency() public {
        uint256 emergencyPrice = 1500 * 10**18;
        oracle.pausePriceFeed(address(lETH), emergencyPrice);
        
        (uint256 price, uint256 updatedAt, bool isStale) = oracle.getPriceWithMetadata(address(lETH));
        
        assertEq(price, emergencyPrice);
        assertEq(updatedAt, block.timestamp);
        assertFalse(isStale);
    }
    
    // === Health Check Tests ===
    
    function testCheckPriceFeedHealth() public view {
        (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(address(lETH));
        
        assertTrue(healthy);
        assertEq(reason, "Healthy");
    }
    
    function testCheckPriceFeedHealthNoFeed() public {
        MockLToken newToken = new MockLToken("New Token", "NEW");
        
        (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(address(newToken));
        
        assertFalse(healthy);
        assertEq(reason, "Price feed not set");
    }
    
    function testCheckPriceFeedHealthStale() public {
        vm.warp(block.timestamp + 3601);
        
        (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(address(lETH));
        
        assertFalse(healthy);
        assertEq(reason, "Price too stale");
    }
    
    function testCheckPriceFeedHealthNegativePrice() public {
        ethPriceFeed.setPrice(-100);
        
        (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(address(lETH));
        
        assertFalse(healthy);
        assertEq(reason, "Invalid price");
    }
    
    function testCheckPriceFeedHealthEmergency() public {
        oracle.pausePriceFeed(address(lETH), 1500 * 10**18);
        
        (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(address(lETH));
        
        assertTrue(healthy);
        assertEq(reason, "Using emergency price");
    }
    
    // === Batch Operations Tests ===
    
    function testGetBatchPrices() public view {
        address[] memory tokens = new address[](2);
        tokens[0] = address(lETH);
        tokens[1] = address(lUSDC);
        
        uint256[] memory prices = oracle.getBatchPrices(tokens);
        
        assertEq(prices.length, 2);
        assertEq(prices[0], 2000000000000000000000); // 2000 * 10^18
        assertEq(prices[1], 1000000000000000000); // 1 * 10^18
    }
    
    function testGetBatchPricesWithError() public {
        MockLToken newToken = new MockLToken("New Token", "NEW");
        
        address[] memory tokens = new address[](3);
        tokens[0] = address(lETH);
        tokens[1] = address(lUSDC);
        tokens[2] = address(newToken); // No price feed set
        
        vm.expectRevert("Price feed not set");
        oracle.getBatchPrices(tokens);
    }
    
    // === Integration Tests ===
    
    function testFullEmergencyScenario() public {
        // Normal operation
        assertEq(oracle.getUnderlyingPrice(address(lETH)), 2000 * 10**18);
        
        // Price feed becomes unhealthy
        ethPriceFeed.setPrice(0);
        
        // Can't get price normally
        vm.expectRevert("Invalid price from Chainlink");
        oracle.getUnderlyingPrice(address(lETH));
        
        // Pause with emergency price
        oracle.pausePriceFeed(address(lETH), 1900 * 10**18);
        
        // Can get emergency price
        assertEq(oracle.getUnderlyingPrice(address(lETH)), 1900000000000000000000);
        
        // Fix price feed
        ethPriceFeed.setPrice(ETH_PRICE);
        
        // Resume normal operation
        oracle.resumePriceFeed(address(lETH));
        
        // Back to normal price
        assertEq(oracle.getUnderlyingPrice(address(lETH)), 2000000000000000000000);
    }
    
    function testPriceFeedRevert() public {
        // Create a reverting price feed
        MockAggregatorV3 revertingFeed = new MockAggregatorV3(8, 2000 * 10**8);
        MockLToken revertToken = new MockLToken("Revert Token", "REV");
        
        // Set the price feed first
        oracle.setPriceFeed(address(revertToken), address(revertingFeed));
        
        // Now make it revert
        revertingFeed.setShouldRevert(true);
        
        // Check health returns false with appropriate message
        (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(address(revertToken));
        assertFalse(healthy);
        assertEq(reason, "Feed call failed");
    }
}

// === Fork Tests (Run against real Sepolia) ===
contract ChainlinkPriceOracleForkTest is Test {
    ChainlinkPriceOracle public oracle;
    address public owner = address(this);
    
    // Mock lTokens
    MockLToken public lETH;
    MockLToken public lUSDC;
    
    string SEPOLIA_RPC_URL = vm.envString("SEPOLIA_RPC_URL");
    
    function setUp() public {
        // Fork Sepolia
        vm.createSelectFork(SEPOLIA_RPC_URL);
        
        // Deploy oracle
        oracle = new ChainlinkPriceOracle(owner);
        
        // Deploy mock lTokens
        lETH = new MockLToken("Lending ETH", "lETH");
        lUSDC = new MockLToken("Lending USDC", "lUSDC");
        
        // Set up real Chainlink price feeds
        oracle.setPriceFeed(address(lETH), SepoliaFeeds.ETH_USD);
        oracle.setPriceFeed(address(lUSDC), SepoliaFeeds.USDC_USD);
    }
    
    function testRealChainlinkPrices() public {
        uint256 ethPrice = oracle.getUnderlyingPrice(address(lETH));
        uint256 usdcPrice = oracle.getUnderlyingPrice(address(lUSDC));
        
        // ETH should be > $1000 and < $10000 (reasonable bounds)
        assertGt(ethPrice, 1000 * 10**18);
        assertLt(ethPrice, 10000 * 10**18);
        
        // USDC should be close to $1 (0.99 - 1.01)
        assertGt(usdcPrice, 0.99 * 10**18);
        assertLt(usdcPrice, 1.01 * 10**18);
        
        console.log("Real ETH Price: $", ethPrice / 10**18);
        console.log("Real USDC Price: $", usdcPrice / 10**18);
    }
    
    function testRealPriceFeedHealth() public {
        (bool ethHealthy, string memory ethReason) = oracle.checkPriceFeedHealth(address(lETH));
        (bool usdcHealthy, string memory usdcReason) = oracle.checkPriceFeedHealth(address(lUSDC));
        
        assertTrue(ethHealthy);
        assertTrue(usdcHealthy);
        assertEq(ethReason, "Healthy");
        assertEq(usdcReason, "Healthy");
    }
}