import { loadConfig } from '../config/index.js';
import { logger } from '../config/logger.js';
import { parsePointsFromLabels } from '../utils/point-parser.js';
import { extractAddressFromBio } from '../utils/address-resolver.js';
import { GitHubService } from './github.service.js';
import { ContractService } from './contract.service.js';
import { AppError } from '../utils/errors.js';
import type { RewardResult } from '../types/contract.js';
import type { GitHubWebhookPayload } from '../types/github.js';

const STROOPS_PER_XLM = 10_000_000n;

export class RewardService {
  private readonly github: GitHubService;
  private readonly contract: ContractService;
  private readonly pricePerPoint: number;

  constructor() {
    this.github = new GitHubService();
    this.contract = new ContractService();
    this.pricePerPoint = loadConfig().reward.pricePerPoint;
  }

  async processPullRequest(payload: GitHubWebhookPayload): Promise<RewardResult> {
    const { pull_request } = payload;
    const { number: issueId, user, labels } = pull_request;

    logger.info({ issueId, contributor: user.login }, 'Processing merged PR');

    const { points } = parsePointsFromLabels(labels);

    const stroopsPerPoint = BigInt(Math.round(this.pricePerPoint * Number(STROOPS_PER_XLM)));
    const amountStroops = BigInt(points) * stroopsPerPoint;
    const amountXlm = Number(amountStroops) / Number(STROOPS_PER_XLM);

    const githubUser = await this.github.getUser(user.login);

    const contributorAddress = extractAddressFromBio(githubUser.bio);

    const alreadyPaid = await this.contract.isAlreadyPaid(issueId);
    if (alreadyPaid) {
      throw new AppError(
        `Issue ${issueId} has already been rewarded`,
        409,
        'ALREADY_PAID',
      );
    }

    const txHash = await this.contract.releaseReward(
      contributorAddress,
      issueId,
      amountStroops,
    );

    const result: RewardResult = {
      issueId,
      contributor: user.login,
      contributorAddress,
      points,
      amount: amountXlm.toFixed(7),
      txHash,
    };

    logger.info(result, 'Reward released successfully');

    return result;
  }
}
