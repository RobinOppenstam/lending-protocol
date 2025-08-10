// test/VerifyChainlinkOracle.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/ChainlinkPriceOracle.sol";

/**
 * @title VerifyChainlinkOracleTest
 * @notice Test the deployed ChainlinkPriceOracle on Sepolia fork
 */
contract VerifyChainlinkOracleTest is Test {
    ChainlinkPriceOracle public oracle;
    
    address constant DEPLOYED_ORACLE = 0x8404c491A1249acAea57c194A909CaC0F091B18f;
    address constant LETH_ADDRESS = 0xcF8BA7B373f8ba60f2c19d97d47FfC9c88f87ec1;
    address constant LUSDC_ADDRESS = 0x3EE49fdd5ED68eF29727130672232d5D6FC61564;
    
    function setUp() public {
        // Fork Sepolia at the current block
        vm.createSelectFork("https://eth-sepolia.g.alchemy.com/v2/cF8u9YTZ66Uk2bwSln6sw");
        oracle = ChainlinkPriceOracle(DEPLOYED_ORACLE);
    }
    
    function testOracleDeployed() public {
        // Verify the oracle exists at the expected address
        assertTrue(address(oracle).code.length > 0, "Oracle not deployed");
        
        console.log("=== ORACLE VERIFICATION ===");
        console.log("Oracle Address:", address(oracle));
        console.log("Oracle Code Size:", address(oracle).code.length);
    }
    
    function testGetETHPrice() public {
        console.log("=== ETH PRICE TEST ===");
        
        try oracle.getUnderlyingPrice(LETH_ADDRESS) returns (uint256 ethPrice) {
            console.log("ETH Price: $", ethPrice / 1e18);
            console.log("ETH Price (wei):", ethPrice);
            
            // ETH price should be reasonable (between $1000 and $10000)
            assertGt(ethPrice, 1000 * 1e18, "ETH price too low");
            assertLt(ethPrice, 10000 * 1e18, "ETH price too high");
            
        } catch Error(string memory reason) {
            console.log("ETH Price Error:", reason);
            fail("Failed to get ETH price");
        }
    }
    
    function testGetUSDCPrice() public {
        console.log("=== USDC PRICE TEST ===");
        
        try oracle.getUnderlyingPrice(LUSDC_ADDRESS) returns (uint256 usdcPrice) {
            console.log("USDC Price: $", usdcPrice / 1e18);
            console.log("USDC Price (wei):", usdcPrice);
            
            // USDC price should be close to $1 (between $0.90 and $1.10)
            assertGt(usdcPrice, 0.9 * 1e18, "USDC price too low");
            assertLt(usdcPrice, 1.1 * 1e18, "USDC price too high");
            
        } catch Error(string memory reason) {
            console.log("USDC Price Error:", reason);
            fail("Failed to get USDC price");
        }
    }
    
    function testPriceFeedHealth() public {
        console.log("=== PRICE FEED HEALTH ===");
        
        // Check ETH feed health
        (bool ethHealthy, string memory ethReason) = oracle.checkPriceFeedHealth(LETH_ADDRESS);
        console.log("ETH Feed Healthy:", ethHealthy);
        console.log("ETH Feed Reason:", ethReason);
        
        // Check USDC feed health
        (bool usdcHealthy, string memory usdcReason) = oracle.checkPriceFeedHealth(LUSDC_ADDRESS);
        console.log("USDC Feed Healthy:", usdcHealthy);
        console.log("USDC Feed Reason:", usdcReason);
        
        // At least one feed should be healthy
        assertTrue(ethHealthy || usdcHealthy, "No price feeds are healthy");
    }
    
    function testEmergencyStatus() public {
        console.log("=== EMERGENCY STATUS ===");
        
        bool ethEmergency = oracle.useEmergencyPrice(LETH_ADDRESS);
        bool usdcEmergency = oracle.useEmergencyPrice(LUSDC_ADDRESS);
        
        console.log("ETH Emergency Mode:", ethEmergency);
        console.log("USDC Emergency Mode:", usdcEmergency);
        
        if (ethEmergency) {
            uint256 ethEmergencyPrice = oracle.emergencyPrices(LETH_ADDRESS);
            console.log("ETH Emergency Price: $", ethEmergencyPrice / 1e18);
        }
        
        if (usdcEmergency) {
            uint256 usdcEmergencyPrice = oracle.emergencyPrices(LUSDC_ADDRESS);
            console.log("USDC Emergency Price: $", usdcEmergencyPrice / 1e18);
        }
    }
    
    function testOracleConstants() public {
        console.log("=== ORACLE CONSTANTS ===");
        console.log("MIN_PRICE: $", oracle.MIN_PRICE() / 1e18);
        console.log("MAX_PRICE: $", oracle.MAX_PRICE() / 1e18);
        console.log("MAX_PRICE_AGE:", oracle.MAX_PRICE_AGE(), "seconds");
        
        // Verify reasonable constants
        assertEq(oracle.MIN_PRICE(), 1e15, "MIN_PRICE incorrect");
        assertEq(oracle.MAX_PRICE(), 1e24, "MAX_PRICE incorrect");
        assertEq(oracle.MAX_PRICE_AGE(), 3600, "MAX_PRICE_AGE incorrect");
    }
}