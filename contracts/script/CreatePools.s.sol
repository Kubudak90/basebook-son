// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface ILBFactory {
    function createLBPair(
        address tokenX,
        address tokenY,
        uint24 activeId,
        uint16 binStep
    ) external returns (address pair);
    
    function owner() external view returns (address);
}

/**
 * @title CreatePools
 * @dev Create PEPE/BRETT pool on LBFactory
 */
contract CreatePools is Script {
    // LBFactory address on Base Sepolia
    address constant LB_FACTORY = 0x1aF4454bdcE78b2D130b4CD8fcd867195b7a2D1B;
    
    // Token addresses
    address constant PEPE = 0xB4c0b1B1d68543595c88a8a5761F3e5a49D80Ba7;
    address constant BRETT = 0x9BC54af6fa1e613cE9b48a965165F706e574d1AB;
    address constant WETH = 0x4200000000000000000000000000000000000006;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        ILBFactory factory = ILBFactory(LB_FACTORY);
        
        console.log("Creating pools...");

        vm.startBroadcast(deployerPrivateKey);

        // Create PEPE/WETH pool (binStep 25 = 0.25%)
        console.log("Creating PEPE/WETH pool...");
        address pepeBrettPair = factory.createLBPair(
            PEPE,
            WETH,
            8388608, // center bin (price = 1)
            25       // binStep 25 = 0.25%
        );
        console.log("PEPE/WETH pool created at:", pepeBrettPair);
        
        // Create BRETT/WETH pool (binStep 25 = 0.25%)
        console.log("Creating BRETT/WETH pool...");
        address brettWethPair = factory.createLBPair(
            BRETT,
            WETH,
            8388608,
            25
        );
        console.log("BRETT/WETH pool created at:", brettWethPair);

        vm.stopBroadcast();
        
        console.log("All pools created!");
    }
}
