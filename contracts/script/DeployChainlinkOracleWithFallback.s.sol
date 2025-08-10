// script/DeployChainlinkOracleWithFallback.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ChainlinkPriceOracle.sol";
import "../src/LendingProtocol.sol";

contract DeployChainlinkOracleWithFallbackScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== DEPLOYING CHAINLINK ORACLE ===");
        console.log("Deployer:", deployer);
        console.log("Network: Sepolia Testnet");

        // 1. Deploy Chainlink Oracle
        ChainlinkPriceOracle chainlinkOracle = new ChainlinkPriceOracle(deployer);
        console.log("Chainlink Oracle deployed:", address(chainlinkOracle));

        // 2. Get existing contract addresses
        address lUSDCAddress = vm.envAddress("LUSDC_ADDRESS");
        address lETHAddress = vm.envAddress("LETH_ADDRESS");
        
        console.log("Setting up price feeds for:");
        console.log("lUSDC:", lUSDCAddress);
        console.log("lETH:", lETHAddress);

        // 3. Try to set up price feeds with fallback handling
        console.log("\n=== SETTING UP ETH/USD PRICE FEED ===");
        try chainlinkOracle.setPriceFeed(lETHAddress, SepoliaFeeds.ETH_USD) {
            console.log("[SUCCESS] ETH/USD price feed configured");
            
            // Test the price
            uint256 ethPrice = chainlinkOracle.getUnderlyingPrice(lETHAddress);
            console.log("Current ETH Price: $", ethPrice / 1e18);
        } catch Error(string memory reason) {
            console.log("[FAILED] ETH/USD setup failed:", reason);
            
            // Set emergency price as fallback
            console.log("Setting emergency ETH price: $2600");
            chainlinkOracle.setEmergencyPrice(lETHAddress, 2600 * 1e18);
            chainlinkOracle.setEmergencyMode(lETHAddress, true);
        }

        console.log("\n=== SETTING UP USDC/USD PRICE FEED ===");
        try chainlinkOracle.setPriceFeed(lUSDCAddress, SepoliaFeeds.USDC_USD) {
            console.log("[SUCCESS] USDC/USD price feed configured");
            
            // Test the price
            uint256 usdcPrice = chainlinkOracle.getUnderlyingPrice(lUSDCAddress);
            console.log("Current USDC Price: $", usdcPrice / 1e18);
        } catch Error(string memory reason) {
            console.log("[FAILED] USDC/USD setup failed:", reason);
            
            // Set emergency price as fallback
            console.log("Setting emergency USDC price: $1.00");
            chainlinkOracle.setEmergencyPrice(lUSDCAddress, 1 * 1e18);
            chainlinkOracle.setEmergencyMode(lUSDCAddress, true);
        }

        // 4. Final health check
        console.log("\n=== FINAL HEALTH CHECK ===");
        
        (bool ethHealthy, string memory ethReason) = chainlinkOracle.checkPriceFeedHealth(lETHAddress);
        (bool usdcHealthy, string memory usdcReason) = chainlinkOracle.checkPriceFeedHealth(lUSDCAddress);
        
        console.log("ETH Feed Status:", ethHealthy ? "[HEALTHY]" : "[EMERGENCY]");
        console.log("ETH Reason:", ethReason);
        console.log("USDC Feed Status:", usdcHealthy ? "[HEALTHY]" : "[EMERGENCY]");
        console.log("USDC Reason:", usdcReason);

        // 5. Test final prices
        uint256 finalEthPrice = chainlinkOracle.getUnderlyingPrice(lETHAddress);
        uint256 finalUsdcPrice = chainlinkOracle.getUnderlyingPrice(lUSDCAddress);
        
        console.log("\n=== FINAL PRICES ===");
        console.log("ETH Price: $", finalEthPrice / 1e18);
        console.log("USDC Price: $", finalUsdcPrice / 1e18);

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Chainlink Oracle Address:", address(chainlinkOracle));
        console.log("\n=== NEXT STEPS ===");
        console.log("1. Update your Comptroller to use this new oracle:");
        console.log("   comptroller.setOracle(", address(chainlinkOracle), ")");
        console.log("2. Monitor price feed health regularly");
        console.log("3. Resume normal price feeds when they become healthy again");
        console.log("   oracle.resumePriceFeed(lToken_ADDRESS)");
    }
}