// script/DeployChainlinkOracle.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ChainlinkPriceOracle.sol";
import "../src/LendingProtocol.sol";

contract DeployChainlinkOracleScript is Script {
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

        // 2. Get existing contract addresses from environment or hardcode
        address lUSDCAddress = vm.envAddress("LUSDC_ADDRESS");
        address lETHAddress = vm.envAddress("LETH_ADDRESS");
        
        console.log("Setting up price feeds for:");
        console.log("lUSDC:", lUSDCAddress);
        console.log("lETH:", lETHAddress);

        // 3. Set up Chainlink price feeds for Sepolia
        chainlinkOracle.setPriceFeed(
            lETHAddress, 
            SepoliaFeeds.ETH_USD  // 0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
        console.log("[SUCCESS] ETH/USD price feed configured");

        chainlinkOracle.setPriceFeed(
            lUSDCAddress, 
            SepoliaFeeds.USDC_USD // 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E
        );
        console.log("[SUCCESS] USDC/USD price feed configured");

        // 4. Test price feeds
        console.log("\n=== TESTING PRICE FEEDS ===");
        
        uint256 ethPrice = chainlinkOracle.getUnderlyingPrice(lETHAddress);
        uint256 usdcPrice = chainlinkOracle.getUnderlyingPrice(lUSDCAddress);
        
        console.log("Current ETH Price: $", ethPrice / 1e18);
        console.log("Current USDC Price: $", usdcPrice / 1e18);
        
        // 5. Check price feed health
        (bool ethHealthy, string memory ethReason) = chainlinkOracle.checkPriceFeedHealth(lETHAddress);
        (bool usdcHealthy, string memory usdcReason) = chainlinkOracle.checkPriceFeedHealth(lUSDCAddress);
        
        console.log("\n=== PRICE FEED HEALTH ===");
        console.log("ETH Feed Healthy:", ethHealthy, "-", ethReason);
        console.log("USDC Feed Healthy:", usdcHealthy, "-", usdcReason);
        
        require(ethHealthy && usdcHealthy, "Price feeds not healthy");

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT COMPLETE ===");
        console.log("Chainlink Oracle Address:", address(chainlinkOracle));
        console.log("\n=== NEXT STEPS ===");
        console.log("1. Update your Comptroller to use this new oracle:");
        console.log("   comptroller.setOracle(", address(chainlinkOracle), ")");
        console.log("2. Update frontend config with new oracle address");
        console.log("3. Test with real-time prices!");
    }
}

// script/SwitchToChainlinkOracle.s.sol
contract SwitchToChainlinkOracleScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get addresses from environment
        address comptrollerAddress = vm.envAddress("COMPTROLLER_ADDRESS");
        address chainlinkOracleAddress = vm.envAddress("CHAINLINK_ORACLE_ADDRESS");
        
        console.log("=== SWITCHING TO CHAINLINK ORACLE ===");
        console.log("Comptroller:", comptrollerAddress);
        console.log("New Oracle:", chainlinkOracleAddress);

        // Switch the comptroller to use Chainlink oracle
        Comptroller comptroller = Comptroller(comptrollerAddress);
        
        // Get old oracle for comparison
        address oldOracle = address(comptroller.oracle());
        console.log("Old Oracle:", oldOracle);
        
        // Set new oracle
        comptroller.setOracle(chainlinkOracleAddress);
        console.log("[SUCCESS] Oracle switched successfully");
        
        // Verify the switch
        address newOracle = address(comptroller.oracle());
        require(newOracle == chainlinkOracleAddress, "Oracle switch failed");
        console.log("[SUCCESS] Oracle switch verified");

        vm.stopBroadcast();

        console.log("\n=== SWITCH COMPLETE ===");
        console.log("Your protocol now uses real-time Chainlink prices!");
        console.log("ETH price will automatically track market prices");
        console.log("USDC price will track actual USDC/USD rate");
    }
}

// script/TestChainlinkPrices.s.sol
contract TestChainlinkPricesScript is Script {
    function run() external view {
        address chainlinkOracleAddress = vm.envAddress("CHAINLINK_ORACLE_ADDRESS");
        address lUSDCAddress = vm.envAddress("LUSDC_ADDRESS");
        address lETHAddress = vm.envAddress("LETH_ADDRESS");
        
        ChainlinkPriceOracle oracle = ChainlinkPriceOracle(chainlinkOracleAddress);
        
        console.log("=== REAL-TIME CHAINLINK PRICES ===");
        
        // Get current prices
        uint256 ethPrice = oracle.getUnderlyingPrice(lETHAddress);
        uint256 usdcPrice = oracle.getUnderlyingPrice(lUSDCAddress);
        
        console.log("ETH Price: $", ethPrice / 1e18);
        console.log("USDC Price: $", usdcPrice / 1e18);
        
        // Get price metadata
        {
            (uint256 price, uint256 updatedAt, bool stale) = oracle.getPriceWithMetadata(lETHAddress);
            console.log("\n=== ETH PRICE METADATA ===");
            console.log("Price:", price / 1e18);
            console.log("Last Updated:", updatedAt);
            console.log("Is Stale:", stale);
        }
        
        {
            (uint256 price, uint256 updatedAt, bool stale) = oracle.getPriceWithMetadata(lUSDCAddress);
            console.log("\n=== USDC PRICE METADATA ===");
            console.log("Price:", price / 1e18);
            console.log("Last Updated:", updatedAt);
            console.log("Is Stale:", stale);
        }
        
        // Health check
        {
            (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(lETHAddress);
            console.log("\n=== ETH HEALTH STATUS ===");
            console.log("Healthy:", healthy);
            console.log("Reason:", reason);
        }
        
        {
            (bool healthy, string memory reason) = oracle.checkPriceFeedHealth(lUSDCAddress);
            console.log("\n=== USDC HEALTH STATUS ===");
            console.log("Healthy:", healthy);
            console.log("Reason:", reason);
        }
    }
}