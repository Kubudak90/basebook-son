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
}

contract CreatePepeBrettPool is Script {
    address constant LB_FACTORY = 0x1aF4454bdcE78b2D130b4CD8fcd867195b7a2D1B;
    address constant BRETT = 0x9BC54af6fa1e613cE9b48a965165F706e574d1AB; // tokenX (lower)
    address constant PEPE = 0xB4c0b1B1d68543595c88a8a5761F3e5a49D80Ba7;  // tokenY (higher)

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        ILBFactory factory = ILBFactory(LB_FACTORY);

        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Creating BRETT/PEPE pool with binStep 25...");
        address pair = factory.createLBPair(BRETT, PEPE, 8388608, 25);
        console.log("Pool created at:", pair);

        vm.stopBroadcast();
    }
}
