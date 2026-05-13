// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {WaveVault} from "../src/WaveVault.sol";

contract WaveVaultTest is Test {
    WaveVault public vault;
    address public oracle;
    address public contributor;
    address public owner;
    address public attacker;

    uint256 constant ISSUE_ID = 1;
    uint256 constant AMOUNT = 0.1 ether;

    event RewardPaid(address indexed contributor, uint256 indexed issueId, uint256 amount);
    event OracleUpdated(address indexed previousOracle, address indexed newOracle);

    function setUp() public {
        oracle = makeAddr("oracle");
        contributor = makeAddr("contributor");
        owner = makeAddr("owner");
        attacker = makeAddr("attacker");

        vm.prank(owner);
        vault = new WaveVault(oracle);

        vm.deal(address(vault), 10 ether);
    }

    function test_Constructor() public {
        assertEq(vault.oracle(), oracle);
        assertEq(vault.owner(), owner);
    }

    function test_RevertWhen_ZeroAddressOracle() public {
        vm.prank(owner);
        vm.expectRevert();
        new WaveVault(address(0));
    }

    function test_ReleaseReward() public {
        vm.prank(oracle);
        vm.expectEmit(true, true, true, true);
        emit RewardPaid(contributor, ISSUE_ID, AMOUNT);
        vault.releaseReward(payable(contributor), ISSUE_ID, AMOUNT);

        assertTrue(vault.paidIssues(ISSUE_ID));
        assertEq(contributor.balance, AMOUNT);
    }

    function test_RevertWhen_NotOracle() public {
        vm.prank(attacker);
        vm.expectRevert();
        vault.releaseReward(payable(contributor), ISSUE_ID, AMOUNT);
    }

    function test_RevertWhen_DuplicatePayment() public {
        vm.prank(oracle);
        vault.releaseReward(payable(contributor), ISSUE_ID, AMOUNT);

        vm.prank(oracle);
        vm.expectRevert(
            abi.encodeWithSelector(WaveVault.AlreadyPaid.selector, ISSUE_ID)
        );
        vault.releaseReward(payable(contributor), ISSUE_ID, AMOUNT);
    }

    function test_RevertWhen_ZeroAddressContributor() public {
        vm.prank(oracle);
        vm.expectRevert(WaveVault.ZeroAddress.selector);
        vault.releaseReward(payable(address(0)), ISSUE_ID, AMOUNT);
    }

    function test_RevertWhen_ZeroAmount() public {
        vm.prank(oracle);
        vm.expectRevert(WaveVault.ZeroAmount.selector);
        vault.releaseReward(payable(contributor), ISSUE_ID, 0);
    }

    function test_RevertWhen_InsufficientBalance() public {
        uint256 hugeAmount = 1000 ether;
        vm.prank(oracle);
        vm.expectRevert(WaveVault.InsufficientBalance.selector);
        vault.releaseReward(payable(contributor), ISSUE_ID, hugeAmount);
    }

    function test_SetOracle() public {
        address newOracle = makeAddr("newOracle");

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit OracleUpdated(oracle, newOracle);
        vault.setOracle(newOracle);

        assertEq(vault.oracle(), newOracle);
    }

    function test_RevertWhen_NonOwnerSetsOracle() public {
        vm.prank(attacker);
        vm.expectRevert();
        vault.setOracle(makeAddr("hacker"));
    }

    function test_RevertWhen_ZeroAddressNewOracle() public {
        vm.prank(owner);
        vm.expectRevert(WaveVault.ZeroAddress.selector);
        vault.setOracle(address(0));
    }

    function test_Pause() public {
        vm.prank(owner);
        vault.pause();

        vm.prank(oracle);
        vm.expectRevert();
        vault.releaseReward(payable(contributor), ISSUE_ID, AMOUNT);
    }

    function test_Unpause() public {
        vm.prank(owner);
        vault.pause();

        vm.prank(owner);
        vault.unpause();

        vm.prank(oracle);
        vault.releaseReward(payable(contributor), ISSUE_ID, AMOUNT);
        assertTrue(vault.paidIssues(ISSUE_ID));
    }

    function test_RevertWhen_NonOwnerPauses() public {
        vm.prank(attacker);
        vm.expectRevert();
        vault.pause();
    }

    function test_ReceiveEth() public {
        uint256 amount = 5 ether;
        vm.deal(attacker, amount);

        vm.prank(attacker);
        (bool sent, ) = address(vault).call{value: amount}("");
        assertTrue(sent);

        assertEq(address(vault).balance, 10 ether + amount);
    }

    function test_MultipleRewards() public {
        address contributor2 = makeAddr("contributor2");

        vm.prank(oracle);
        vault.releaseReward(payable(contributor), 1, 1 ether);

        vm.prank(oracle);
        vault.releaseReward(payable(contributor2), 2, 2 ether);

        assertTrue(vault.paidIssues(1));
        assertTrue(vault.paidIssues(2));
        assertEq(contributor.balance, 1 ether);
        assertEq(contributor2.balance, 2 ether);
    }

    function test_OracleNotPausable() public {
        vm.prank(oracle);
        vm.expectRevert();
        vault.pause();
    }
}
