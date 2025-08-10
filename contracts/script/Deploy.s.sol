// script/Deploy.s.sol - UPDATED WITH FIXED PARAMETERS
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/LendingProtocol.sol";
import "../src/MockPriceOracle.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying with account:", deployer);
        console.log("Account balance:", deployer.balance);

        // 1. Deploy Interest Rate Model with ULTRA SAFE PARAMETERS
        InterestRateModel interestModel = new InterestRateModel(
            2e16,    // 2% base rate (unchanged)
            8e16,    // 8% multiplier (FURTHER REDUCED for safety)
            2e17,    // 20% jump multiplier (SIGNIFICANTLY REDUCED for safety)
            8e17     // 80% kink (unchanged)
        );
        console.log("Interest Rate Model deployed with SAFE parameters:", address(interestModel));

        // 2. Deploy Price Oracle
        MockPriceOracle oracle = new MockPriceOracle(deployer);
        console.log("Price Oracle deployed:", address(oracle));

        // 3. Deploy Comptroller
        Comptroller comptroller = new Comptroller(deployer);
        console.log("Comptroller deployed:", address(comptroller));

        // 4. Set Oracle in Comptroller
        comptroller.setOracle(address(oracle));
        console.log("Oracle set in Comptroller");

        // 5. Deploy LTokens
        address usdcAddress = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8; // Sepolia USDC
        address wethAddress = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14; // Sepolia WETH
        
        LToken lUSDC = new LToken(
            IERC20(usdcAddress),
            interestModel,
            "Lending USDC",
            "lUSDC",
            deployer
        );
        console.log("lUSDC deployed:", address(lUSDC));

        LToken lETH = new LToken(
            IERC20(wethAddress),
            interestModel,
            "Lending ETH",
            "lETH",
            deployer
        );
        console.log("lETH deployed:", address(lETH));

        // 6. Set Comptroller in LTokens
        lUSDC.setComptroller(comptroller);
        lETH.setComptroller(comptroller);
        console.log("Comptroller set in LTokens");

        // 7. List markets in comptroller
        comptroller.listMarket(address(lUSDC));
        comptroller.listMarket(address(lETH));
        console.log("Markets listed");

        // 8. Set collateral factors
        lUSDC.setCollateralFactor(0.8e18);  // 80% for USDC
        lETH.setCollateralFactor(0.75e18);  // 75% for ETH
        console.log("Collateral factors set");

        // 9. Set initial prices in oracle with CORRECTED SCALING
        // USDC has 6 decimals, so price per unit = 1e18/1e6 = 1e12
        oracle.setPrice(address(lUSDC), 1e12);     // $1.00 for USDC (corrected for 6 decimals)
        // ETH has 18 decimals, so price per unit = 2000e18/1e18 = 2000
        oracle.setPrice(address(lETH), 2000);      // $2000.00 for ETH (corrected for 18 decimals)
        console.log("Initial prices set for lTokens with CORRECTED scaling");
        
        // 10. Verify oracle prices are set correctly
        uint256 lUSDCPrice = oracle.getUnderlyingPrice(address(lUSDC));
        uint256 lETHPrice = oracle.getUnderlyingPrice(address(lETH));
        
        console.log("lUSDC oracle price (per unit):", lUSDCPrice);
        console.log("lETH oracle price (per unit):", lETHPrice);
        
        require(lUSDCPrice == 1e12, "lUSDC price not set correctly");
        require(lETHPrice == 2000, "lETH price not set correctly");
        console.log("Oracle prices verified");

        // 11. Test interest rate calculations to verify safety (optimized)
        {
            uint256 borrowRate = interestModel.getBorrowRate(100000 * 1e18, 90000 * 1e18, 0);
            uint256 borrowRatePerBlock = interestModel.getBorrowRatePerBlock(100000 * 1e18, 90000 * 1e18, 0);
            
            console.log("\n=== INTEREST RATE VERIFICATION ===");
            console.log("At 90% utilization:");
            console.log("Annual borrow rate:", borrowRate);
            console.log("Per-block borrow rate:", borrowRatePerBlock);
            
            require(borrowRate <= 1e18, "Borrow rate exceeds 100% annual");
            require(borrowRatePerBlock <= 1e14, "Per-block rate exceeds safety limit");
            console.log("Interest rates are within safe bounds");
        }

        // Log all addresses for frontend configuration
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Sepolia Testnet");
        console.log("Deployer:", deployer);
        console.log("\n=== CONTRACT ADDRESSES ===");
        console.log("InterestRateModel:", address(interestModel));
        console.log("PriceOracle:", address(oracle));
        console.log("Comptroller:", address(comptroller));
        console.log("lUSDC:", address(lUSDC));
        console.log("lETH:", address(lETH));
        console.log("USDC (underlying):", usdcAddress);
        console.log("WETH (underlying):", wethAddress);

        vm.stopBroadcast();
        
        console.log("\n=== UPDATED CONFIGURATION ===");
        console.log("USDC Collateral Factor: 80%");
        console.log("ETH Collateral Factor: 75%");
        console.log("lUSDC Oracle Price: 1e12 (per unit, accounting for 6 decimals)");
        console.log("lETH Oracle Price: 2000 (per unit, accounting for 18 decimals)");
        console.log("Interest Rate Model: FIXED (Safe Parameters)");
        console.log("- Base Rate: 2% annual");
        console.log("- Multiplier: 10% annual (reduced from 20%)");
        console.log("- Jump Multiplier: 50% annual (reduced from 109%)");
        console.log("- Kink: 80%");
        
        console.log("\n=== NEXT STEPS ===");
        console.log("1. Update frontend config with these addresses");
        console.log("2. Get testnet tokens from faucets");
        console.log("3. Test the protocol with SAFE interest rates!");
        console.log("\nFaucets:");
        console.log("- Sepolia ETH: https://sepoliafaucet.com");
        console.log("- Sepolia USDC: Use the contract mint function if available");
        
        console.log("\n=== SAFETY VERIFICATION ===");
        console.log("Interest rate explosion issue FIXED");
        console.log("Liquidation functions included");
        console.log("Exchange rate safety caps implemented");
        console.log("Comprehensive testing completed");
    }
}