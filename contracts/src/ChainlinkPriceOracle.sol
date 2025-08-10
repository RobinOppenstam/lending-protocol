// src/ChainlinkPriceOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LendingProtocol.sol";

/**
 * @title ChainlinkPriceOracle
 * @notice Production-ready price oracle using Chainlink price feeds
 * @dev Maps lToken addresses to their underlying asset price feeds
 */
contract ChainlinkPriceOracle is IPriceOracle, Ownable {
    
    /// @notice Mapping of lToken addresses to their Chainlink price feeds
    mapping(address => AggregatorV3Interface) public priceFeeds;
    
    /// @notice Mapping of lToken addresses to price feed decimals
    mapping(address => uint8) public feedDecimals;
    
    /// @notice Maximum age of a price before it's considered stale (in seconds)
    uint256 public constant MAX_PRICE_AGE = 3600; // 1 hour
    
    /// @notice Minimum valid price to prevent oracle manipulation
    uint256 public constant MIN_PRICE = 1e15; // $0.001
    
    /// @notice Maximum valid price to prevent oracle manipulation  
    uint256 public constant MAX_PRICE = 1e24; // $1,000,000
    
    /// @notice Emergency price storage for fallback
    mapping(address => uint256) public emergencyPrices;
    mapping(address => bool) public useEmergencyPrice;
    
    // Events
    event PriceFeedSet(address indexed lToken, address indexed priceFeed, uint8 decimals);
    event EmergencyPriceSet(address indexed lToken, uint256 price);
    event EmergencyModeToggled(address indexed lToken, bool enabled);
    event PriceUpdated(address indexed lToken, uint256 price, uint256 timestamp);
    
    constructor(address _initialOwner) Ownable(_initialOwner) {}
    
    /**
     * @notice Set the Chainlink price feed for an lToken
     * @param lToken The address of the lToken (e.g., lETH, lUSDC)
     * @param priceFeed The address of the Chainlink price feed
     */
    function setPriceFeed(address lToken, address priceFeed) external onlyOwner {
        require(lToken != address(0), "Invalid lToken address");
        require(priceFeed != address(0), "Invalid price feed address");
        
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
        
        // Verify the feed works by getting latest data
        (, int256 price, , uint256 updatedAt, ) = feed.latestRoundData();
        require(price > 0, "Invalid price from feed");
        require(block.timestamp - updatedAt <= MAX_PRICE_AGE, "Price feed stale");
        
        // Get and store decimals
        uint8 decimals = feed.decimals();
        require(decimals <= 18, "Too many decimals");
        
        priceFeeds[lToken] = feed;
        feedDecimals[lToken] = decimals;
        
        emit PriceFeedSet(lToken, priceFeed, decimals);
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
        require(block.timestamp - updatedAt <= MAX_PRICE_AGE, "Chainlink price too stale");
        
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
     * @notice Get price with additional metadata
     * @param lToken The address of the lToken
     * @return price The current price (18 decimals)
     * @return updatedAt When the price was last updated
     * @return isStale Whether the price is considered stale
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
        
        bool stale = block.timestamp - timestamp > MAX_PRICE_AGE;
        
        return (scaledPrice, timestamp, stale);
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
     * @notice Check if price feed is healthy
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
            if (block.timestamp - updatedAt > MAX_PRICE_AGE) {
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
        require(block.timestamp - updatedAt <= MAX_PRICE_AGE, "Price feed still stale");
        
        useEmergencyPrice[lToken] = false;
        emit EmergencyModeToggled(lToken, false);
    }
}

// Sepolia Testnet Chainlink Price Feed Addresses
library SepoliaFeeds {
    // ETH/USD Price Feed on Sepolia
    address public constant ETH_USD = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
    
    // USDC/USD Price Feed on Sepolia  
    address public constant USDC_USD = 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E;
    
    // BTC/USD Price Feed on Sepolia (for future use)
    address public constant BTC_USD = 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43;
}

// Mainnet Chainlink Price Feed Addresses (for future use)
library MainnetFeeds {
    // ETH/USD Price Feed on Mainnet
    address public constant ETH_USD = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
    
    // USDC/USD Price Feed on Mainnet
    address public constant USDC_USD = 0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6;
    
    // BTC/USD Price Feed on Mainnet
    address public constant BTC_USD = 0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c;
}