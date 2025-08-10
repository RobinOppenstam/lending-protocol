// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ChainlinkPriceOracleV2.sol";

contract DeployChainlinkOracleV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying ChainlinkPriceOracleV2 with flexible staleness...");
        console.log("Deployer:", deployer);
        
        // Deploy the enhanced oracle
        ChainlinkPriceOracleV2 oracle = new ChainlinkPriceOracleV2(deployer);
        
        console.log("Oracle V2 deployed at:", address(oracle));
        
        // Get addresses
        address lETH = vm.envAddress("LETH_ADDRESS");
        address lUSDC = vm.envAddress("LUSDC_ADDRESS");
        
        console.log("Configuring price feeds:");
        console.log("lETH (volatile):", lETH);
        console.log("lUSDC (stablecoin):", lUSDC);
        
        // Configure ETH as volatile asset (1 hour staleness)
        try oracle.setPriceFeed(
            lETH, 
            0x694AA1769357215DE4FAC081bf1f309aDC325306, // ETH/USD feed
            ChainlinkPriceOracleV2.AssetType.VOLATILE
        ) {
            console.log("ETH/USD price feed configured (1h staleness)");
        } catch Error(string memory reason) {
            console.log("ETH feed setup failed:", reason);
        }
        
        // Configure USDC as stablecoin (25 hours staleness)
        try oracle.setPriceFeed(
            lUSDC, 
            0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E, // USDC/USD feed
            ChainlinkPriceOracleV2.AssetType.STABLECOIN
        ) {
            console.log("USDC/USD price feed configured (25h staleness)");
        } catch Error(string memory reason) {
            console.log("USDC feed setup failed:", reason);
            console.log("Setting USDC emergency fallback...");
            oracle.setEmergencyPrice(lUSDC, 999844310000000000); // $0.999844
            oracle.setEmergencyMode(lUSDC, true);
            console.log("USDC emergency mode enabled");
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== TESTING PRICES ===");
        
        // Test prices (read-only)
        try oracle.getUnderlyingPrice(lETH) returns (uint256 ethPrice) {
            console.log("ETH Price: $", ethPrice / 1e18);
            console.log("ETH Max Age:", oracle.getMaxPriceAge(lETH), "seconds");
        } catch {
            console.log("ETH price failed");
        }
        
        try oracle.getUnderlyingPrice(lUSDC) returns (uint256 usdcPrice) {
            console.log("USDC Price: $", usdcPrice / 1e18);  
            console.log("USDC Max Age:", oracle.getMaxPriceAge(lUSDC), "seconds");
        } catch {
            console.log("USDC price failed");
        }
        
        console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
        console.log("Oracle V2 Address:", address(oracle));
        console.log("Features:");
        console.log("- ETH: 1 hour staleness tolerance");
        console.log("- USDC: 25 hour staleness tolerance");
        console.log("- Emergency fallback system");
    }
}