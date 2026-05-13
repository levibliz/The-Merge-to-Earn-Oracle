import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RewardService } from '../services/reward.service.js';
import type { GitHubWebhookPayload } from '../types/github.js';

vi.mock('../services/github.service.js');
vi.mock('../services/contract.service.js');
vi.mock('../config/logger.js');

const validPayload: GitHubWebhookPayload = {
  action: 'closed',
  pull_request: {
    number: 42,
    merged: true,
    user: {
      login: 'testuser',
      bio: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    },
    labels: [{ name: 'drips-wave: 100' }],
  },
};

describe('RewardService', () => {
  let service: RewardService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RewardService();
  });

  it('processes a valid merged PR successfully', async () => {
    const { GitHubService } = await import('../services/github.service.js');
    const { ContractService } = await import('../services/contract.service.js');

    const mockGithub = vi.mocked(GitHubService.prototype);
    const mockContract = vi.mocked(ContractService.prototype);

    mockGithub.getUser.mockResolvedValue({
      login: 'testuser',
      bio: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    });

    mockContract.isAlreadyPaid.mockResolvedValue(false);
    mockContract.releaseReward.mockResolvedValue(
      '0xabcdef1234567890',
    );

    const result = await service.processPullRequest(validPayload);

    expect(result).toMatchObject({
      issueId: 42,
      contributor: 'testuser',
      contributorAddress: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      points: 100,
      txHash: '0xabcdef1234567890',
    });
  });

  it('throws when issue is already paid', async () => {
    const { ContractService } = await import('../services/contract.service.js');
    const mockContract = vi.mocked(ContractService.prototype);

    mockContract.isAlreadyPaid.mockResolvedValue(true);

    await expect(
      service.processPullRequest(validPayload),
    ).rejects.toThrow('already been rewarded');
  });

  it('throws when no drips-wave label exists', async () => {
    const payloadWithoutLabel: GitHubWebhookPayload = {
      ...validPayload,
      pull_request: {
        ...validPayload.pull_request,
        labels: [{ name: 'bug' }],
      },
    };

    await expect(
      service.processPullRequest(payloadWithoutLabel),
    ).rejects.toThrow('No "drips-wave');
  });

  it('throws when user has no bio', async () => {
    const { GitHubService } = await import('../services/github.service.js');
    const { ContractService } = await import('../services/contract.service.js');

    const mockGithub = vi.mocked(GitHubService.prototype);
    const mockContract = vi.mocked(ContractService.prototype);

    mockGithub.getUser.mockResolvedValue({
      login: 'testuser',
      bio: null,
    });
    mockContract.isAlreadyPaid.mockResolvedValue(false);

    await expect(
      service.processPullRequest(validPayload),
    ).rejects.toThrow('no bio');
  });
});
