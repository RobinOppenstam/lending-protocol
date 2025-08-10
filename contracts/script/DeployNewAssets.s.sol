// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/LendingProtocol.sol";
import "../src/ChainlinkPriceOracleV2.sol";

contract DeployNewAssets is Script {
    // Existing deployed contracts (from your current deployment)
    address constant COMPTROLLER = 0x300068b3EA3d6080065f31d6914c818aFbf69671;
    address constant CHAINLINK_ORACLE = 0xdbb126a47D145AcdF08569950E6027f5D55153e1;
    address constant INTEREST_MODEL = 0xDE93bFeB6f948B88e946d7aD62Ff73c93aE2B9C8;
    
    // Sepolia testnet token addresses (from Aave's testnet deployments)
    address constant WBTC = 0x29f2D40B0605204364af54EC677bD022dA425d03; // Wrapped Bitcoin on Sepolia
    address constant LINK = 0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5; // Chainlink token on Sepolia  
    address constant USDT = 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0; // Tether on Sepolia
    
    // Chainlink price feed addresses on Sepolia
    address constant BTC_USD_FEED = 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43;
    address constant LINK_USD_FEED = 0xc59E3633BAAC79493d908e63626716e204A45EdF;
    address constant USDT_USD_FEED = 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E; // Same as USDC/USD on testnet
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== Deploying New Assets (WBTC, LINK, USDT) ===");
        console.log("Deployer:", deployer);
        console.log("Using existing Comptroller:", COMPTROLLER);
        console.log("Using existing Oracle:", CHAINLINK_ORACLE);
        console.log("Using existing Interest Model:", INTEREST_MODEL);
        
        // Get contract instances
        Comptroller comptroller = Comptroller(COMPTROLLER);
        ChainlinkPriceOracleV2 oracle = ChainlinkPriceOracleV2(CHAINLINK_ORACLE);
        InterestRateModel interestModel = InterestRateModel(INTEREST_MODEL);
        
        // 1. Deploy lWBTC
        console.log("\n=== Deploying lWBTC ===");
        LToken lWBTC = new LToken(
            IERC20(WBTC),
            interestModel,
            "Lending Wrapped Bitcoin",
            "lWBTC",
            deployer
        );
        console.log("lWBTC deployed at:", address(lWBTC));
        
        // Set WBTC parameters (Bitcoin is volatile, slightly lower collateral factor)
        lWBTC.setCollateralFactor(0.7e18); // 70% collateral factor
        lWBTC.setReserveFactor(0.15e18);   // 15% reserve factor
        lWBTC.setComptroller(comptroller);
        console.log("lWBTC parameters set");
        
        // 2. Deploy lLINK
        console.log("\n=== Deploying lLINK ===");
        LToken lLINK = new LToken(
            IERC20(LINK),
            interestModel,
            "Lending Chainlink",
            "lLINK",
            deployer
        );
        console.log("lLINK deployed at:", address(lLINK));
        
        // Set LINK parameters (oracle token, moderate risk)
        lLINK.setCollateralFactor(0.65e18); // 65% collateral factor
        lLINK.setReserveFactor(0.1e18);     // 10% reserve factor
        lLINK.setComptroller(comptroller);
        console.log("lLINK parameters set");
        
        // 3. Deploy lUSDT
        console.log("\n=== Deploying lUSDT ===");
        LToken lUSDT = new LToken(
            IERC20(USDT),
            interestModel,
            "Lending Tether",
            "lUSDT",
            deployer
        );
        console.log("lUSDT deployed at:", address(lUSDT));
        
        // Set USDT parameters (stablecoin, similar to USDC)
        lUSDT.setCollateralFactor(0.8e18); // 80% collateral factor
        lUSDT.setReserveFactor(0.1e18);    // 10% reserve factor
        lUSDT.setComptroller(comptroller);
        console.log("lUSDT parameters set");
        
        // 4. List markets in Comptroller
        console.log("\n=== Listing Markets in Comptroller ===");
        comptroller.listMarket(address(lWBTC));
        console.log("lWBTC listed");
        
        comptroller.listMarket(address(lLINK));
        console.log("lLINK listed");
        
        comptroller.listMarket(address(lUSDT));
        console.log("lUSDT listed");
        
        // 5. Configure Oracle Price Feeds
        console.log("\n=== Configuring Oracle Price Feeds ===");
        
        // WBTC as volatile asset
        oracle.setPriceFeed(
            address(lWBTC),
            BTC_USD_FEED,
            ChainlinkPriceOracleV2.AssetType.VOLATILE
        );
        console.log("BTC/USD price feed configured for lWBTC");
        
        // LINK as volatile asset
        oracle.setPriceFeed(
            address(lLINK),
            LINK_USD_FEED,
            ChainlinkPriceOracleV2.AssetType.VOLATILE
        );
        console.log("LINK/USD price feed configured for lLINK");
        
        // USDT as stablecoin
        oracle.setPriceFeed(
            address(lUSDT),
            USDT_USD_FEED,
            ChainlinkPriceOracleV2.AssetType.STABLECOIN
        );
        console.log("USDT/USD price feed configured for lUSDT");
        
        vm.stopBroadcast();
        
        // Test price feeds
        console.log("\n=== Testing Price Feeds ===");
        try oracle.getUnderlyingPrice(address(lWBTC)) returns (uint256 btcPrice) {
            console.log("BTC Price: $", btcPrice / 1e18);
        } catch {
            console.log("BTC price feed failed");
        }
        
        try oracle.getUnderlyingPrice(address(lLINK)) returns (uint256 linkPrice) {
            console.log("LINK Price: $", linkPrice / 1e18);
        } catch {
            console.log("LINK price feed failed");
        }
        
        try oracle.getUnderlyingPrice(address(lUSDT)) returns (uint256 usdtPrice) {
            console.log("USDT Price: $", usdtPrice / 1e18);
        } catch {
            console.log("USDT price feed failed");
        }
        
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("lWBTC:", address(lWBTC));
        console.log("lLINK:", address(lLINK));
        console.log("lUSDT:", address(lUSDT));
        console.log("\nAdd these addresses to your frontend configuration!");
    }
}