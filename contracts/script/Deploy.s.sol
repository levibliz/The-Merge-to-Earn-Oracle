// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {WaveVault} from "../src/WaveVault.sol";

contract DeployScript is Script {
    function run() external {
        address oracle = vm.envAddress("ORACLE_ADDRESS");

        vm.startBroadcast();

        WaveVault vault = new WaveVault(oracle);

        vm.stopBroadcast();

        console2.log("WaveVault deployed at:", address(vault));
        console2.log("Oracle address:", oracle);
    }
}
