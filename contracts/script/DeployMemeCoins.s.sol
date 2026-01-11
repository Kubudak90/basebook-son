// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MemeCoin.sol";

/**
 * @title DeployMemeCoins
 * @dev Deploy all meme coins to Base Sepolia
 * 
 * Run with:
 * forge script script/DeployMemeCoins.s.sol:DeployMemeCoins --rpc-url base-sepolia --broadcast --verify
 */
contract DeployMemeCoins is Script {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens

    struct TokenInfo {
        string name;
        string symbol;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        TokenInfo[] memory tokens = new TokenInfo[](2);
        tokens[0] = TokenInfo("Pepe", "PEPE");
        tokens[1] = TokenInfo("Brett", "BRETT");

        vm.startBroadcast(deployerPrivateKey);

        for (uint256 i = 0; i < tokens.length; i++) {
            MemeCoin token = new MemeCoin(
                tokens[i].name,
                tokens[i].symbol,
                INITIAL_SUPPLY
            );
            
            console.log("Deployed", tokens[i].symbol, "at:", address(token));
        }

        vm.stopBroadcast();
    }
}
