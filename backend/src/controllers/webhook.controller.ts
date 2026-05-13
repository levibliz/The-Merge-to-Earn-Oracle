import type { Request, Response } from 'express';
import { z } from 'zod';
import { RewardService } from '../services/reward.service.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/errors.js';

const webhookPayloadSchema = z.object({
  action: z.literal('closed'),
  pull_request: z.object({
    number: z.number().int().positive(),
    merged: z.literal(true),
    user: z.object({
      login: z.string().min(1),
      bio: z.string().optional(),
    }),
    labels: z.array(
      z.object({
        name: z.string(),
      }),
    ),
  }),
});

const rewardService = new RewardService();

export async function handleWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const deliveryId = req.headers['x-github-delivery'] as string;

  logger.info({ deliveryId }, 'Webhook received');

  const parsed = webhookPayloadSchema.safeParse(req.body);

  if (!parsed.success) {
    logger.warn(
      { deliveryId, errors: parsed.error.errors },
      'Webhook payload validation failed',
    );
    res.status(400).json({
      success: false,
      error: 'Invalid webhook payload',
      details: parsed.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  try {
    const result = await rewardService.processPullRequest(parsed.data);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn(
        { deliveryId, error: error.message, code: error.code },
        'Webhook processing failed',
      );
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    logger.error(
      { deliveryId, error },
      'Unexpected error processing webhook',
    );
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
