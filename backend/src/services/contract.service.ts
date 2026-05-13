import { ethers } from 'ethers';
import { loadConfig } from '../config/index.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/errors.js';

const CONTRACT_ABI = [
  'function releaseReward(address _contributor, uint256 _issueId, uint256 _amount) external',
  'function paidIssues(uint256) external view returns (bool)',
  'event RewardPaid(address indexed contributor, uint256 indexed issueId, uint256 amount)',
];

export class ContractService {
  private readonly provider: ethers.JsonRpcProvider;
  private readonly wallet: ethers.Wallet;
  private readonly contract: ethers.Contract;

  constructor() {
    const config = loadConfig();

    this.provider = new ethers.JsonRpcProvider(config.contract.rpcUrl);
    this.wallet = new ethers.Wallet(config.contract.oraclePrivateKey, this.provider);
    this.contract = new ethers.Contract(
      config.contract.address,
      CONTRACT_ABI,
      this.wallet,
    );
  }

  async isAlreadyPaid(issueId: number): Promise<boolean> {
    return (this.contract.paidIssues as Function)(issueId) as unknown as boolean;
  }

  async releaseReward(
    contributorAddress: string,
    issueId: number,
    amountInWei: bigint,
  ): Promise<string> {
    logger.info(
      { contributorAddress, issueId, amount: amountInWei.toString() },
      'Submitting reward transaction',
    );

    const alreadyPaid = await this.isAlreadyPaid(issueId);
    if (alreadyPaid) {
      throw new AppError(
        `Issue ${issueId} has already been rewarded`,
        409,
        'ALREADY_PAID',
      );
    }

    try {
      const tx = (await (this.contract.releaseReward as Function)(
        contributorAddress,
        issueId,
        amountInWei,
        {
          gasLimit: 100000,
        },
      )) as unknown as ethers.TransactionResponse;

      logger.info({ txHash: tx.hash, issueId }, 'Transaction submitted');

      const receipt = await tx.wait();

      if (!receipt) {
        throw new AppError('Transaction receipt not found', 502, 'CONTRACT_ERROR');
      }

      logger.info(
        { txHash: receipt.hash, blockNumber: receipt.blockNumber, issueId },
        'Reward transaction confirmed',
      );

      return receipt.hash;
    } catch (error) {
      logger.error({ error, issueId }, 'Contract transaction failed');
      throw new AppError(
        `Failed to release reward: ${error instanceof Error ? error.message : 'Unknown error'}`,
        502,
        'CONTRACT_ERROR',
      );
    }
  }
}
