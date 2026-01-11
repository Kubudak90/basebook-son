// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MemeCoin
 * @dev A simple ERC20 meme coin with faucet functionality built-in
 */
contract MemeCoin is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**18; // 1000 tokens per claim
    uint256 public constant FAUCET_COOLDOWN = 24 hours;
    
    mapping(address => uint256) public lastFaucetClaim;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Claim free tokens from faucet (once per hour)
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet: Please wait before claiming again"
        );
        
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
    
    /**
     * @dev Check if address can claim from faucet
     */
    function canClaimFaucet(address account) external view returns (bool) {
        return block.timestamp >= lastFaucetClaim[account] + FAUCET_COOLDOWN;
    }
    
    /**
     * @dev Time until next faucet claim is available
     */
    function timeUntilNextClaim(address account) external view returns (uint256) {
        uint256 nextClaimTime = lastFaucetClaim[account] + FAUCET_COOLDOWN;
        if (block.timestamp >= nextClaimTime) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }
    
    /**
     * @dev Owner can mint additional tokens
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
