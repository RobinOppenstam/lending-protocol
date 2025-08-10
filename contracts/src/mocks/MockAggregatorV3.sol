// src/mocks/MockAggregatorV3.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title MockAggregatorV3
 * @notice Mock implementation of Chainlink's AggregatorV3Interface for testing
 */
contract MockAggregatorV3 is AggregatorV3Interface {
    uint8 public immutable override decimals;
    string public constant override description = "Mock Price Feed";
    uint256 public constant override version = 1;
    
    int256 private _price;
    uint256 private _updatedAt;
    uint80 private _roundId;
    bool private _shouldRevert;
    
    constructor(uint8 _decimals, int256 _initialPrice) {
        decimals = _decimals;
        _price = _initialPrice;
        _updatedAt = block.timestamp;
        _roundId = 1;
    }
    
    function setPrice(int256 newPrice) external {
        _price = newPrice;
        _updatedAt = block.timestamp;
        _roundId++;
    }
    
    function setUpdatedAt(uint256 timestamp) external {
        _updatedAt = timestamp;
    }
    
    function setShouldRevert(bool shouldRevert) external {
        _shouldRevert = shouldRevert;
    }
    
    function latestRoundData() external view override returns (
        uint80 roundId,
        int256 price,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        require(!_shouldRevert, "Mock revert");
        
        return (
            _roundId,
            _price,
            _updatedAt,
            _updatedAt,
            _roundId
        );
    }
    
    function getRoundData(uint80 /*_roundId*/) external view override returns (
        uint80 roundId,
        int256 price,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        require(!_shouldRevert, "Mock revert");
        
        return (
            _roundId,
            _price,
            _updatedAt,
            _updatedAt,
            _roundId
        );
    }
}