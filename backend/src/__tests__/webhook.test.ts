import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../app.js';
import { loadConfig } from '../config/index.js';
import { createHmac } from 'node:crypto';
import request from 'supertest';

vi.mock('../services/reward.service.js');
vi.mock('../config/logger.js');

function createSignature(payload: string): string {
  const config = loadConfig();
  return `sha256=${createHmac('sha256', config.github.webhookSecret)
    .update(payload)
    .digest('hex')}`;
}

describe('Webhook Endpoint', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
    process.env['GITHUB_WEBHOOK_SECRET'] = 'test-secret';
  });

  it('returns 401 when signature is missing', async () => {
    const res = await request(app)
      .post('/webhook')
      .send({})
      .expect(401);

    expect(res.body.error).toBe('Missing webhook signature');
  });

  it('returns 400 for non-merged PR', async () => {
    const payload = {
      action: 'closed',
      pull_request: {
        number: 1,
        merged: false,
        user: { login: 'user' },
        labels: [],
      },
    };

    const body = JSON.stringify(payload);

    const res = await request(app)
      .post('/webhook')
      .set('x-hub-signature-256', createSignature(body))
      .set('x-github-event', 'pull_request')
      .set('x-github-delivery', 'test-delivery-1')
      .send(payload)
      .expect(400);

    expect(res.body.error).toBe('Invalid webhook payload');
  });

  it('returns 200 for valid merged PR', async () => {
    const { RewardService } = await import('../services/reward.service.js');
    const mockReward = vi.mocked(RewardService.prototype);

    mockReward.processPullRequest.mockResolvedValue({
      issueId: 1,
      contributor: 'user',
      contributorAddress: 'GA7QNF7C3PJ4XZ6QJ3K5Y5V7Z7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q',
      points: 100,
      amount: '0.0010000',
      txHash: 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890',
    });

    const payload = {
      action: 'closed',
      pull_request: {
        number: 1,
        merged: true,
        user: { login: 'user' },
        labels: [{ name: 'drips-wave: 100' }],
      },
    };

    const body = JSON.stringify(payload);

    const res = await request(app)
      .post('/webhook')
      .set('x-hub-signature-256', createSignature(body))
      .set('x-github-event', 'pull_request')
      .set('x-github-delivery', 'test-delivery-2')
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.issueId).toBe(1);
  });

  it('returns 401 for invalid signature', async () => {
    const payload = {
      action: 'closed',
      pull_request: {
        number: 1,
        merged: true,
        user: { login: 'user' },
        labels: [{ name: 'drips-wave: 100' }],
      },
    };

    const res = await request(app)
      .post('/webhook')
      .set('x-hub-signature-256', 'sha256=invalid')
      .set('x-github-event', 'pull_request')
      .set('x-github-delivery', 'test-delivery-3')
      .send(payload)
      .expect(401);

    expect(res.body.error).toBe('Invalid webhook signature');
  });
});
