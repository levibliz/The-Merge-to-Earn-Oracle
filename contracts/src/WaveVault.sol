// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "openzeppelin/access/Ownable.sol";
import {Pausable} from "openzeppelin/utils/Pausable.sol";
import {ReentrancyGuard} from "openzeppelin/utils/ReentrancyGuard.sol";
import {IWaveVault} from "./interfaces/IWaveVault.sol";

contract WaveVault is IWaveVault, Ownable, Pausable, ReentrancyGuard {
    address public oracle;
    mapping(uint256 => bool) public paidIssues;

    constructor(address _oracle) Ownable(msg.sender) {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = _oracle;
    }

    modifier onlyOracle() {
        if (msg.sender != oracle) revert OnlyOracle();
        _;
    }

    function releaseReward(
        address payable _contributor,
        uint256 _issueId,
        uint256 _amount
    ) external onlyOracle nonReentrant whenNotPaused {
        if (_contributor == address(0)) revert ZeroAddress();
        if (_amount == 0) revert ZeroAmount();
        if (paidIssues[_issueId]) revert AlreadyPaid(_issueId);
        if (address(this).balance < _amount) revert InsufficientBalance();

        paidIssues[_issueId] = true;

        (bool sent, ) = _contributor.call{value: _amount}("");
        if (!sent) revert TransferFailed();

        emit RewardPaid(_contributor, _issueId, _amount);
    }

    function setOracle(address _newOracle) external onlyOwner {
        if (_newOracle == address(0)) revert ZeroAddress();
        emit OracleUpdated(oracle, _newOracle);
        oracle = _newOracle;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}
