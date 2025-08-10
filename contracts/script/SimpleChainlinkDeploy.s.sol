// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ChainlinkPriceOracle.sol";

contract SimpleChainlinkDeploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying ChainlinkPriceOracle...");
        console.log("Deployer:", deployer);
        
        // Deploy the oracle
        ChainlinkPriceOracle oracle = new ChainlinkPriceOracle(deployer);
        
        console.log("Oracle deployed at:", address(oracle));
        
        // Set emergency prices immediately
        address lETH = vm.envAddress("LETH_ADDRESS");
        address lUSDC = vm.envAddress("LUSDC_ADDRESS");
        
        // Set emergency prices
        oracle.setEmergencyPrice(lETH, 4200e18); // ~$4200 for ETH
        oracle.setEmergencyPrice(lUSDC, 1e18);   // $1 for USDC
        
        // Enable emergency mode
        oracle.setEmergencyMode(lETH, true);
        oracle.setEmergencyMode(lUSDC, true);
        
        console.log("Emergency prices set:");
        console.log("ETH: $4200");
        console.log("USDC: $1");
        
        // Test the prices
        uint256 ethPrice = oracle.getUnderlyingPrice(lETH);
        uint256 usdcPrice = oracle.getUnderlyingPrice(lUSDC);
        
        console.log("Verified prices:");
        console.log("ETH:", ethPrice / 1e18, "USD");
        console.log("USDC:", usdcPrice / 1e18, "USD");
        
        vm.stopBroadcast();
        
        console.log("Deployment successful!");
        console.log("Oracle address:", address(oracle));
    }
}