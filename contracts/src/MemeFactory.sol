// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MemeCoin.sol";

/**
 * @title MemeFactory
 * @dev Factory contract to deploy multiple meme coins at once
 */
contract MemeFactory {
    event MemeCoinDeployed(string name, string symbol, address tokenAddress);
    
    address[] public deployedTokens;
    mapping(string => address) public tokenBySymbol;
    
    /**
     * @dev Deploy a new meme coin
     */
    function deployMemeCoin(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) external returns (address) {
        MemeCoin token = new MemeCoin(name, symbol, initialSupply);
        token.transferOwnership(msg.sender);
        
        deployedTokens.push(address(token));
        tokenBySymbol[symbol] = address(token);
        
        emit MemeCoinDeployed(name, symbol, address(token));
        return address(token);
    }
    
    /**
     * @dev Get all deployed tokens
     */
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
    
    /**
     * @dev Get token count
     */
    function getTokenCount() external view returns (uint256) {
        return deployedTokens.length;
    }
}
