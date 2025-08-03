// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LendingProtocol.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPriceOracle
 * @notice A simple price oracle for testing and initial deployment
 * @dev This contract allows manual price setting and should be replaced with Chainlink in production
 */
contract MockPriceOracle is IPriceOracle, Ownable {
    /// @notice Mapping of lToken addresses to their underlying asset prices (scaled to 1e18)
    mapping(address => uint256) public prices;
    
    /// @notice Mapping of lToken addresses to when their price was last updated
    mapping(address => uint256) public lastUpdated;
    
    /// @notice Maximum age of a price before it's considered stale (in seconds)
    uint256 public constant MAX_PRICE_AGE = 3600; // 1 hour
    
    /// @notice Emitted when a price is updated
    event PriceUpdated(address indexed lToken, uint256 price, uint256 timestamp);
    
    /// @notice Emitted when multiple prices are updated at once
    event PricesUpdated(address[] lTokens, uint256[] prices, uint256 timestamp);
    
    constructor(address _initialOwner) Ownable(_initialOwner) {}
    
    /**
     * @notice Set the price for a specific lToken
     * @param lToken The address of the lToken
     * @param price The price of the underlying asset (scaled to 1e18)
     */
    function setPrice(address lToken, uint256 price) external onlyOwner {
        require(lToken != address(0), "Invalid lToken address");
        require(price > 0, "Price must be greater than 0");
        
        prices[lToken] = price;
        lastUpdated[lToken] = block.timestamp;
        
        emit PriceUpdated(lToken, price, block.timestamp);
    }
    
    /**
     * @notice Set prices for multiple lTokens at once
     * @param lTokens Array of lToken addresses
     * @param _prices Array of prices (scaled to 1e18)
     */
    function setPrices(
        address[] calldata lTokens, 
        uint256[] calldata _prices
    ) external onlyOwner {
        require(lTokens.length == _prices.length, "Arrays length mismatch");
        require(lTokens.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < lTokens.length; i++) {
            require(lTokens[i] != address(0), "Invalid lToken address");
            require(_prices[i] > 0, "Price must be greater than 0");
            
            prices[lTokens[i]] = _prices[i];
            lastUpdated[lTokens[i]] = block.timestamp;
        }
        
        emit PricesUpdated(lTokens, _prices, block.timestamp);
    }
    
    /**
     * @notice Get the underlying price of an lToken
     * @param lToken The address of the lToken
     * @return The price of the underlying asset (scaled to 1e18)
     */
    function getUnderlyingPrice(address lToken) external view override returns (uint256) {
        uint256 price = prices[lToken];
        require(price > 0, "Price not set");
        
        // Check if price is stale
        uint256 timeSinceUpdate = block.timestamp - lastUpdated[lToken];
        require(timeSinceUpdate <= MAX_PRICE_AGE, "Price is stale");
        
        return price;
    }
    
    /**
     * @notice Get the underlying price without staleness check (for emergency use)
     * @param lToken The address of the lToken
     * @return The price of the underlying asset (scaled to 1e18)
     */
    function getUnderlyingPriceUnsafe(address lToken) external view returns (uint256) {
        return prices[lToken];
    }
    
    /**
     * @notice Check if a price is stale
     * @param lToken The address of the lToken
     * @return true if the price is stale, false otherwise
     */
    function isPriceStale(address lToken) external view returns (bool) {
        if (prices[lToken] == 0) return true;
        uint256 timeSinceUpdate = block.timestamp - lastUpdated[lToken];
        return timeSinceUpdate > MAX_PRICE_AGE;
    }
    
    /**
     * @notice Get the age of a price in seconds
     * @param lToken The address of the lToken
     * @return The age of the price in seconds
     */
    function getPriceAge(address lToken) external view returns (uint256) {
        if (lastUpdated[lToken] == 0) return type(uint256).max;
        return block.timestamp - lastUpdated[lToken];
    }
    
    /**
     * @notice Batch get prices for multiple lTokens
     * @param lTokens Array of lToken addresses
     * @return _prices Array of prices (scaled to 1e18)
     */
    function getPrices(address[] calldata lTokens) external view returns (uint256[] memory _prices) {
        _prices = new uint256[](lTokens.length);
        for (uint256 i = 0; i < lTokens.length; i++) {
            _prices[i] = this.getUnderlyingPrice(lTokens[i]);
        }
    }
    
    /**
     * @notice Emergency function to update a stale price
     * @param lToken The address of the lToken
     * @param price The new price (scaled to 1e18)
     * @dev This function can be used if a price becomes stale and needs immediate update
     */
    function emergencyPriceUpdate(address lToken, uint256 price) external onlyOwner {
        require(lToken != address(0), "Invalid lToken address");
        require(price > 0, "Price must be greater than 0");
        
        // Allow emergency updates even if current price exists
        prices[lToken] = price;
        lastUpdated[lToken] = block.timestamp;
        
        emit PriceUpdated(lToken, price, block.timestamp);
    }
}


