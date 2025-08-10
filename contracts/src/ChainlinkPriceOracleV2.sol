// src/ChainlinkPriceOracleV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LendingProtocol.sol";

/**
 * @title ChainlinkPriceOracleV2
 * @notice Enhanced price oracle with different staleness tolerances for different asset types
 * @dev Allows longer staleness for stablecoins vs volatile assets
 */
contract ChainlinkPriceOracleV2 is IPriceOracle, Ownable {
    
    /// @notice Mapping of lToken addresses to their Chainlink price feeds
    mapping(address => AggregatorV3Interface) public priceFeeds;
    
    /// @notice Mapping of lToken addresses to price feed decimals
    mapping(address => uint8) public feedDecimals;
    
    /// @notice Mapping of lToken addresses to their staleness tolerance
    mapping(address => uint256) public maxPriceAge;
    
    /// @notice Default maximum age for volatile assets (1 hour)
    uint256 public constant DEFAULT_MAX_PRICE_AGE = 3600;
    
    /// @notice Extended maximum age for stablecoins (25 hours)
    uint256 public constant STABLECOIN_MAX_PRICE_AGE = 90000; // 25 hours
    
    /// @notice Minimum valid price to prevent oracle manipulation
    uint256 public constant MIN_PRICE = 1e15; // $0.001
    
    /// @notice Maximum valid price to prevent oracle manipulation  
    uint256 public constant MAX_PRICE = 1e24; // $1,000,000
    
    /// @notice Emergency price storage for fallback
    mapping(address => uint256) public emergencyPrices;
    mapping(address => bool) public useEmergencyPrice;
    
    /// @notice Asset type enumeration
    enum AssetType { VOLATILE, STABLECOIN }
    mapping(address => AssetType) public assetTypes;
    
    // Events
    event PriceFeedSet(address indexed lToken, address indexed priceFeed, uint8 decimals, AssetType assetType);
    event AssetTypeSet(address indexed lToken, AssetType assetType);
    event EmergencyPriceSet(address indexed lToken, uint256 price);
    event EmergencyModeToggled(address indexed lToken, bool enabled);
    event PriceUpdated(address indexed lToken, uint256 price, uint256 timestamp);
    
    constructor(address _initialOwner) Ownable(_initialOwner) {}
    
    /**
     * @notice Set the Chainlink price feed for an lToken with asset type
     * @param lToken The address of the lToken (e.g., lETH, lUSDC)
     * @param priceFeed The address of the Chainlink price feed
     * @param assetType Whether this is a volatile asset or stablecoin
     */
    function setPriceFeed(address lToken, address priceFeed, AssetType assetType) external onlyOwner {
        require(lToken != address(0), "Invalid lToken address");
        require(priceFeed != address(0), "Invalid price feed address");
        
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
        
        // Set staleness tolerance based on asset type
        uint256 maxAge = assetType == AssetType.STABLECOIN ? STABLECOIN_MAX_PRICE_AGE : DEFAULT_MAX_PRICE_AGE;
        maxPriceAge[lToken] = maxAge;
        assetTypes[lToken] = assetType;
        
        // Verify the feed works by getting latest data
        (, int256 price, , uint256 updatedAt, ) = feed.latestRoundData();
        require(price > 0, "Invalid price from feed");
        require(block.timestamp - updatedAt <= maxAge, "Price feed too stale for asset type");
        
        // Get and store decimals
        uint8 decimals = feed.decimals();
        require(decimals <= 18, "Too many decimals");
        
        priceFeeds[lToken] = feed;
        feedDecimals[lToken] = decimals;
        
        emit PriceFeedSet(lToken, priceFeed, decimals, assetType);
        emit AssetTypeSet(lToken, assetType);
    }
    
    /**
     * @notice Set asset type for an existing lToken
     * @param lToken The address of the lToken
     * @param assetType The new asset type
     */
    function setAssetType(address lToken, AssetType assetType) external onlyOwner {
        require(address(priceFeeds[lToken]) != address(0), "Price feed not set");
        
        assetTypes[lToken] = assetType;
        uint256 maxAge = assetType == AssetType.STABLECOIN ? STABLECOIN_MAX_PRICE_AGE : DEFAULT_MAX_PRICE_AGE;
        maxPriceAge[lToken] = maxAge;
        
        emit AssetTypeSet(lToken, assetType);
    }
    
    /**
     * @notice Get the underlying price from Chainlink (required by IPriceOracle)
     * @param lToken The address of the lToken
     * @return The price of the underlying asset (scaled to 18 decimals)
     */
    function getUnderlyingPrice(address lToken) external view override returns (uint256) {
        // Check if emergency price should be used
        if (useEmergencyPrice[lToken]) {
            uint256 emergencyPrice = emergencyPrices[lToken];
            require(emergencyPrice > 0, "Emergency price not set");
            return emergencyPrice;
        }
        
        AggregatorV3Interface priceFeed = priceFeeds[lToken];
        require(address(priceFeed) != address(0), "Price feed not set");
        
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from Chainlink");
        
        // Use asset-specific staleness tolerance
        uint256 allowedAge = maxPriceAge[lToken] > 0 ? maxPriceAge[lToken] : DEFAULT_MAX_PRICE_AGE;
        require(block.timestamp - updatedAt <= allowedAge, "Chainlink price too stale");
        
        uint256 priceUint = uint256(price);
        
        // Scale price to 18 decimals
        uint8 decimals = feedDecimals[lToken];
        uint256 scaledPrice;
        if (decimals < 18) {
            scaledPrice = priceUint * (10 ** (18 - decimals));
        } else if (decimals > 18) {
            scaledPrice = priceUint / (10 ** (decimals - 18));
        } else {
            scaledPrice = priceUint;
        }
        
        // Sanity check price bounds on the scaled price
        require(scaledPrice >= MIN_PRICE && scaledPrice <= MAX_PRICE, "Price out of bounds");
        
        return scaledPrice;
    }
    
    /**
     * @notice Get price with additional metadata including staleness info
     * @param lToken The address of the lToken
     * @return price The current price (18 decimals)
     * @return updatedAt When the price was last updated
     * @return isStale Whether the price is considered stale for this asset type
     */
    function getPriceWithMetadata(address lToken) external view returns (
        uint256 price,
        uint256 updatedAt,
        bool isStale
    ) {
        if (useEmergencyPrice[lToken]) {
            return (emergencyPrices[lToken], block.timestamp, false);
        }
        
        AggregatorV3Interface priceFeed = priceFeeds[lToken];
        require(address(priceFeed) != address(0), "Price feed not set");
        
        (, int256 rawPrice, , uint256 timestamp, ) = priceFeed.latestRoundData();
        
        // Scale price to 18 decimals
        uint8 decimals = feedDecimals[lToken];
        uint256 scaledPrice = uint256(rawPrice);
        if (decimals < 18) {
            scaledPrice = scaledPrice * (10 ** (18 - decimals));
        } else if (decimals > 18) {
            scaledPrice = scaledPrice / (10 ** (decimals - 18));
        }
        
        // Check staleness against asset-specific tolerance
        uint256 allowedAge = maxPriceAge[lToken] > 0 ? maxPriceAge[lToken] : DEFAULT_MAX_PRICE_AGE;
        bool stale = block.timestamp - timestamp > allowedAge;
        
        return (scaledPrice, timestamp, stale);
    }
    
    /**
     * @notice Check if price feed is healthy with asset-specific staleness
     * @param lToken The address of the lToken
     * @return healthy Whether the price feed is working properly
     * @return reason Reason if price feed is unhealthy
     */
    function checkPriceFeedHealth(address lToken) external view returns (
        bool healthy, 
        string memory reason
    ) {
        if (useEmergencyPrice[lToken]) {
            return (emergencyPrices[lToken] > 0, "Using emergency price");
        }
        
        AggregatorV3Interface priceFeed = priceFeeds[lToken];
        if (address(priceFeed) == address(0)) {
            return (false, "Price feed not set");
        }
        
        try priceFeed.latestRoundData() returns (
            uint80, int256 price, uint256, uint256 updatedAt, uint80
        ) {
            if (price <= 0) {
                return (false, "Invalid price");
            }
            
            uint256 allowedAge = maxPriceAge[lToken] > 0 ? maxPriceAge[lToken] : DEFAULT_MAX_PRICE_AGE;
            if (block.timestamp - updatedAt > allowedAge) {
                return (false, "Price too stale");
            }
            
            // Scale price to 18 decimals before checking bounds
            uint256 scaledPrice = uint256(price);
            uint8 decimals = feedDecimals[lToken];
            if (decimals < 18) {
                scaledPrice = scaledPrice * (10 ** (18 - decimals));
            } else if (decimals > 18) {
                scaledPrice = scaledPrice / (10 ** (decimals - 18));
            }
            if (scaledPrice < MIN_PRICE || scaledPrice > MAX_PRICE) {
                return (false, "Price out of bounds");
            }
            return (true, "Healthy");
        } catch {
            return (false, "Feed call failed");
        }
    }
    
    /**
     * @notice Get the staleness tolerance for an asset
     * @param lToken The address of the lToken
     * @return The maximum allowed age in seconds
     */
    function getMaxPriceAge(address lToken) external view returns (uint256) {
        return maxPriceAge[lToken] > 0 ? maxPriceAge[lToken] : DEFAULT_MAX_PRICE_AGE;
    }
    
    /**
     * @notice Set emergency price for an lToken (fallback mechanism)
     * @param lToken The address of the lToken
     * @param price The emergency price (scaled to 18 decimals)
     */
    function setEmergencyPrice(address lToken, uint256 price) external onlyOwner {
        require(price > 0, "Price must be greater than 0");
        require(price >= MIN_PRICE && price <= MAX_PRICE, "Price out of bounds");
        
        emergencyPrices[lToken] = price;
        emit EmergencyPriceSet(lToken, price);
    }
    
    /**
     * @notice Toggle emergency mode for an lToken
     * @param lToken The address of the lToken
     * @param enabled Whether to use emergency price
     */
    function setEmergencyMode(address lToken, bool enabled) external onlyOwner {
        if (enabled) {
            require(emergencyPrices[lToken] > 0, "Emergency price not set");
        }
        useEmergencyPrice[lToken] = enabled;
        emit EmergencyModeToggled(lToken, enabled);
    }
    
    /**
     * @notice Get multiple prices at once (gas efficient)
     * @param lTokens Array of lToken addresses
     * @return prices Array of prices (18 decimals)
     */
    function getBatchPrices(address[] calldata lTokens) external view returns (uint256[] memory prices) {
        prices = new uint256[](lTokens.length);
        for (uint256 i = 0; i < lTokens.length; i++) {
            prices[i] = this.getUnderlyingPrice(lTokens[i]);
        }
    }
    
    /**
     * @notice Emergency function to pause a specific price feed
     * @param lToken The lToken to pause price feed for
     * @param emergencyPrice The price to use while paused
     */
    function pausePriceFeed(address lToken, uint256 emergencyPrice) external onlyOwner {
        emergencyPrices[lToken] = emergencyPrice;
        emit EmergencyPriceSet(lToken, emergencyPrice);
        useEmergencyPrice[lToken] = true;
        emit EmergencyModeToggled(lToken, true);
    }
    
    /**
     * @notice Resume normal price feed operation
     * @param lToken The lToken to resume price feed for
     */
    function resumePriceFeed(address lToken) external onlyOwner {
        // Verify the price feed is working before resuming
        AggregatorV3Interface priceFeed = priceFeeds[lToken];
        require(address(priceFeed) != address(0), "Price feed not set");
        
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price from feed");
        
        uint256 allowedAge = maxPriceAge[lToken] > 0 ? maxPriceAge[lToken] : DEFAULT_MAX_PRICE_AGE;
        require(block.timestamp - updatedAt <= allowedAge, "Price feed still stale");
        
        useEmergencyPrice[lToken] = false;
        emit EmergencyModeToggled(lToken, false);
    }
}