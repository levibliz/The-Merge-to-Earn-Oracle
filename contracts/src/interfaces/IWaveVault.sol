// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWaveVault {
    error ZeroAddress();
    error ZeroAmount();
    error OnlyOracle();
    error AlreadyPaid(uint256 issueId);
    error InsufficientBalance();
    error TransferFailed();

    event RewardPaid(address indexed contributor, uint256 indexed issueId, uint256 amount);
    event OracleUpdated(address indexed previousOracle, address indexed newOracle);

    function releaseReward(address payable _contributor, uint256 _issueId, uint256 _amount) external;
    function setOracle(address _newOracle) external;
    function pause() external;
    function unpause() external;
    function oracle() external view returns (address);
    function paidIssues(uint256) external view returns (bool);
}
