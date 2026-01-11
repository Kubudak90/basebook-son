// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface ILBFactory {
    function addQuoteAsset(address quoteAsset) external;
    function owner() external view returns (address);
}

/**
 * @title WhitelistQuoteAssets
 * @dev Whitelist WETH and meme coins as quote assets in LBFactory
 * 
 * Run with:
 * forge script script/WhitelistQuoteAssets.s.sol:WhitelistQuoteAssets --rpc-url https://sepolia.base.org --broadcast
 */
contract WhitelistQuoteAssets is Script {
    // LBFactory address on Base Sepolia
    address constant LB_FACTORY = 0x1aF4454bdcE78b2D130b4CD8fcd867195b7a2D1B;
    
    // Token addresses
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address constant PEPE = 0xB4c0b1B1d68543595c88a8a5761F3e5a49D80Ba7;
    address constant BRETT = 0x9BC54af6fa1e613cE9b48a965165F706e574d1AB;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        ILBFactory factory = ILBFactory(LB_FACTORY);
        
        console.log("LBFactory owner:", factory.owner());
        console.log("Sender:", vm.addr(deployerPrivateKey));

        vm.startBroadcast(deployerPrivateKey);

        // Whitelist meme coins as quote assets (allows pools like PEPE/BRETT)
        console.log("Whitelisting PEPE...");
        factory.addQuoteAsset(PEPE);
        
        console.log("Whitelisting BRETT...");
        factory.addQuoteAsset(BRETT);

        vm.stopBroadcast();
        
        console.log("All tokens whitelisted successfully!");
    }
}
