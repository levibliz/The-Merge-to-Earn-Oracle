import type { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { loadConfig } from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

const config = loadConfig();

export function validateWebhookSignature(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const deliveryId = req.headers['x-github-delivery'] as string | undefined;

  if (!signature) {
    throw new UnauthorizedError('Missing webhook signature');
  }

  const rawBody = (req as any).rawBody as string | undefined;
  if (!rawBody) {
    throw new UnauthorizedError('Missing raw request body');
  }

  const expectedSig = `sha256=${createHmac('sha256', config.github.webhookSecret)
    .update(rawBody)
    .digest('hex')}`;

  try {
    const isvalid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig),
    );

    if (!isvalid) {
      logger.warn(
        { deliveryId },
        'Invalid webhook signature — possible spoofing attempt',
      );
      throw new UnauthorizedError('Invalid webhook signature');
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid webhook signature');
  }

  next();
}
