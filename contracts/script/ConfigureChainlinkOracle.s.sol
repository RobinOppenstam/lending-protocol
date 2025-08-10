// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ChainlinkPriceOracle.sol";

contract ConfigureChainlinkOracle is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address lethAddress = vm.envAddress("LETH_ADDRESS");
        address lusdcAddress = vm.envAddress("LUSDC_ADDRESS"); 
        address oracleAddress = vm.envAddress("CHAINLINK_ORACLE_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        ChainlinkPriceOracle oracle = ChainlinkPriceOracle(oracleAddress);
        
        console.log("Configuring Chainlink Oracle at:", oracleAddress);
        console.log("lETH address:", lethAddress);
        console.log("lUSDC address:", lusdcAddress);
        
        // Configure ETH/USD price feed for lETH
        try oracle.setPriceFeed(lethAddress, SepoliaFeeds.ETH_USD) {
            console.log("Successfully set ETH/USD price feed for lETH");
            console.log("   Feed address:", SepoliaFeeds.ETH_USD);
        } catch Error(string memory reason) {
            console.log("Failed to set ETH price feed:", reason);
            // Try emergency mode for ETH
            console.log("Setting emergency price for ETH...");
            oracle.setEmergencyPrice(lethAddress, 2000e18); // $2000
            oracle.setEmergencyMode(lethAddress, true);
            console.log("ETH emergency mode enabled with $2000 price");
        } catch {
            console.log("Failed to set ETH price feed - unknown error");
            // Try emergency mode for ETH
            console.log("Setting emergency price for ETH...");
            oracle.setEmergencyPrice(lethAddress, 2000e18); // $2000
            oracle.setEmergencyMode(lethAddress, true);
            console.log("ETH emergency mode enabled with $2000 price");
        }
        
        // Configure USDC/USD price feed for lUSDC
        try oracle.setPriceFeed(lusdcAddress, SepoliaFeeds.USDC_USD) {
            console.log("Successfully set USDC/USD price feed for lUSDC");
            console.log("   Feed address:", SepoliaFeeds.USDC_USD);
        } catch Error(string memory reason) {
            console.log("Failed to set USDC price feed:", reason);
            // Try emergency mode for USDC
            console.log("Setting emergency price for USDC...");
            oracle.setEmergencyPrice(lusdcAddress, 1e18); // $1.00
            oracle.setEmergencyMode(lusdcAddress, true);
            console.log("USDC emergency mode enabled with $1.00 price");
        } catch {
            console.log("Failed to set USDC price feed - unknown error");
            // Try emergency mode for USDC
            console.log("Setting emergency price for USDC...");
            oracle.setEmergencyPrice(lusdcAddress, 1e18); // $1.00
            oracle.setEmergencyMode(lusdcAddress, true);
            console.log("USDC emergency mode enabled with $1.00 price");
        }
        
        vm.stopBroadcast();
        
        // Verify configuration
        console.log("Final Configuration:");
        console.log("Oracle Address:", oracleAddress);
        console.log("lETH Address:", lethAddress);
        console.log("lUSDC Address:", lusdcAddress);
        
        // Check if feeds were set or emergency mode is enabled
        console.log("Verification:");
        try oracle.getUnderlyingPrice(lethAddress) returns (uint256 ethPrice) {
            console.log("ETH price available:", ethPrice / 1e18, "USD");
        } catch {
            console.log("ETH price not available");
        }
        
        try oracle.getUnderlyingPrice(lusdcAddress) returns (uint256 usdcPrice) {
            console.log("USDC price available:", usdcPrice / 1e18, "USD");
        } catch {
            console.log("USDC price not available");
        }
    }
}