// script/TestDeployChainlinkOracle.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ChainlinkPriceOracle.sol";

/**
 * @title TestDeployChainlinkOracleScript
 * @notice Simple deployment script for testing ChainlinkPriceOracle without env vars
 */
contract TestDeployChainlinkOracleScript is Script {
    function run() external {
        // Use default foundry test account
        vm.startBroadcast();

        console.log("=== DEPLOYING CHAINLINK ORACLE (TEST) ===");
        console.log("Deployer:", msg.sender);

        // 1. Deploy Chainlink Oracle
        ChainlinkPriceOracle chainlinkOracle = new ChainlinkPriceOracle(msg.sender);
        console.log("Chainlink Oracle deployed:", address(chainlinkOracle));

        // 2. Test oracle constants
        console.log("\n=== ORACLE CONFIGURATION ===");
        console.log("MIN_PRICE:", chainlinkOracle.MIN_PRICE());
        console.log("MAX_PRICE:", chainlinkOracle.MAX_PRICE());
        console.log("MAX_PRICE_AGE:", chainlinkOracle.MAX_PRICE_AGE());

        // 3. Display Sepolia feed addresses
        console.log("\n=== SEPOLIA CHAINLINK FEEDS ===");
        console.log("ETH/USD Feed:", SepoliaFeeds.ETH_USD);
        console.log("USDC/USD Feed:", SepoliaFeeds.USDC_USD);
        console.log("BTC/USD Feed:", SepoliaFeeds.BTC_USD);

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Chainlink Oracle Address:", address(chainlinkOracle));
        console.log("\n=== NEXT STEPS ===");
        console.log("1. Set price feeds for your lTokens:");
        console.log("   oracle.setPriceFeed(lETH_ADDRESS, SepoliaFeeds.ETH_USD)");
        console.log("   oracle.setPriceFeed(lUSDC_ADDRESS, SepoliaFeeds.USDC_USD)");
        console.log("2. Update your protocol's price oracle:");
        console.log("   comptroller.setOracle(", address(chainlinkOracle), ")");
    }
}