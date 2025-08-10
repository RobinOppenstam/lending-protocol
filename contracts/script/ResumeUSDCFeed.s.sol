// script/ResumeUSDCFeed.s.sol  
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ChainlinkPriceOracle.sol";

contract ResumeUSDCFeedScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        ChainlinkPriceOracle oracle = ChainlinkPriceOracle(0x8404c491A1249acAea57c194A909CaC0F091B18f);
        address lUSDC = 0x3EE49fdd5ED68eF29727130672232d5D6FC61564;
        
        console.log("=== ATTEMPTING TO RESUME USDC PRICE FEED ===");
        console.log("Oracle:", address(oracle));
        console.log("lUSDC:", lUSDC);
        
        // Check current status
        console.log("\n=== CURRENT STATUS ===");
        console.log("Emergency Mode:", oracle.useEmergencyPrice(lUSDC));
        if (oracle.useEmergencyPrice(lUSDC)) {
            console.log("Emergency Price: $", oracle.emergencyPrices(lUSDC) / 1e18);
        }
        
        // Try to resume normal feed
        try oracle.resumePriceFeed(lUSDC) {
            console.log("\n[SUCCESS] USDC price feed resumed!");
            
            // Test the new price
            uint256 usdcPrice = oracle.getUnderlyingPrice(lUSDC);
            console.log("New USDC Price: $", usdcPrice / 1e18);
            
            (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(lUSDC);
            console.log("Feed Health:", healthy ? "HEALTHY" : "UNHEALTHY");
            console.log("Reason:", reason);
            
        } catch Error(string memory reason) {
            console.log("\n[FAILED] Could not resume USDC feed:", reason);
            console.log("Keeping emergency mode active");
            
            // Show current emergency price
            uint256 emergencyPrice = oracle.getUnderlyingPrice(lUSDC);
            console.log("Current Emergency Price: $", emergencyPrice / 1e18);
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== RESUME ATTEMPT COMPLETE ===");
    }
}