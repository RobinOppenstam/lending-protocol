// script/TestOracle.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ChainlinkPriceOracle.sol";

contract TestOracleScript is Script {
    function run() external view {
        // Use the deployed oracle address
        ChainlinkPriceOracle oracle = ChainlinkPriceOracle(0x8404c491A1249acAea57c194A909CaC0F091B18f);
        
        // Your lToken addresses
        address lETH = 0xcF8BA7B373f8ba60f2c19d97d47FfC9c88f87ec1;
        address lUSDC = 0x3EE49fdd5ED68eF29727130672232d5D6FC61564;
        
        console.log("=== TESTING DEPLOYED CHAINLINK ORACLE ===");
        console.log("Oracle Address:", address(oracle));
        console.log("lETH Address:", lETH);
        console.log("lUSDC Address:", lUSDC);
        
        console.log("\n=== CURRENT PRICES ===");
        
        // Test ETH price
        try oracle.getUnderlyingPrice(lETH) returns (uint256 ethPrice) {
            console.log("ETH Price: $", ethPrice / 1e18);
            console.log("ETH Price (wei):", ethPrice);
        } catch Error(string memory reason) {
            console.log("ETH Price Error:", reason);
        }
        
        // Test USDC price
        try oracle.getUnderlyingPrice(lUSDC) returns (uint256 usdcPrice) {
            console.log("USDC Price: $", usdcPrice / 1e18);
            console.log("USDC Price (wei):", usdcPrice);
        } catch Error(string memory reason) {
            console.log("USDC Price Error:", reason);
        }
        
        console.log("\n=== PRICE FEED HEALTH ===");
        
        // Check ETH feed health
        {
            (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(lETH);
            console.log("ETH Feed Healthy:", healthy);
            console.log("ETH Feed Reason:", reason);
        }
        
        // Check USDC feed health
        {
            (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(lUSDC);
            console.log("USDC Feed Healthy:", healthy);
            console.log("USDC Feed Reason:", reason);
        }
        
        console.log("\n=== EMERGENCY STATUS ===");
        console.log("ETH Emergency Mode:", oracle.useEmergencyPrice(lETH));
        console.log("USDC Emergency Mode:", oracle.useEmergencyPrice(lUSDC));
        
        if (oracle.useEmergencyPrice(lETH)) {
            console.log("ETH Emergency Price:", oracle.emergencyPrices(lETH) / 1e18);
        }
        
        if (oracle.useEmergencyPrice(lUSDC)) {
            console.log("USDC Emergency Price:", oracle.emergencyPrices(lUSDC) / 1e18);
        }
        
        console.log("\n=== ORACLE CONSTANTS ===");
        console.log("MIN_PRICE:", oracle.MIN_PRICE() / 1e18);
        console.log("MAX_PRICE:", oracle.MAX_PRICE() / 1e18);
        console.log("MAX_PRICE_AGE:", oracle.MAX_PRICE_AGE(), "seconds");
    }
}