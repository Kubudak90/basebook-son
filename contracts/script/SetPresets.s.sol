// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface ILBFactory {
    function setPreset(
        uint16 binStep,
        uint16 baseFactor,
        uint16 filterPeriod,
        uint16 decayPeriod,
        uint16 reductionFactor,
        uint24 variableFeeControl,
        uint16 protocolShare,
        uint24 maxVolatilityAccumulator,
        bool isOpen
    ) external;
    
    function owner() external view returns (address);
}

/**
 * @title SetPresets
 * @dev Set bin step presets in LBFactory
 * 
 * Run with:
 * forge script script/SetPresets.s.sol:SetPresets --rpc-url https://sepolia.base.org --broadcast
 */
contract SetPresets is Script {
    // LBFactory address on Base Sepolia
    address constant LB_FACTORY = 0x1aF4454bdcE78b2D130b4CD8fcd867195b7a2D1B;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        ILBFactory factory = ILBFactory(LB_FACTORY);
        
        console.log("LBFactory owner:", factory.owner());

        vm.startBroadcast(deployerPrivateKey);

        // Set preset for binStep 100 (1% price change per bin)
        // Parameters based on TraderJoe V2 typical values
        console.log("Setting preset for binStep 100...");
        factory.setPreset(
            100,    // binStep (1% = 100 basis points)
            5000,   // baseFactor
            30,     // filterPeriod (seconds)
            600,    // decayPeriod (seconds)
            5000,   // reductionFactor
            40000,  // variableFeeControl
            2500,   // protocolShare (25%)
            350000, // maxVolatilityAccumulator
            true    // isOpen (anyone can create pairs with this bin step)
        );
        
        // Set preset for binStep 50 (0.5% price change per bin)
        console.log("Setting preset for binStep 50...");
        factory.setPreset(
            50,     // binStep (0.5% = 50 basis points)
            5000,   // baseFactor
            30,     // filterPeriod
            600,    // decayPeriod
            5000,   // reductionFactor
            40000,  // variableFeeControl
            2500,   // protocolShare
            350000, // maxVolatilityAccumulator
            true    // isOpen
        );
        
        // Set preset for binStep 25 (0.25% price change per bin)
        console.log("Setting preset for binStep 25...");
        factory.setPreset(
            25,     // binStep (0.25% = 25 basis points)
            5000,   // baseFactor
            30,     // filterPeriod
            600,    // decayPeriod
            5000,   // reductionFactor
            40000,  // variableFeeControl
            2500,   // protocolShare
            350000, // maxVolatilityAccumulator
            true    // isOpen
        );

        vm.stopBroadcast();
        
        console.log("All presets set successfully!");
    }
}
