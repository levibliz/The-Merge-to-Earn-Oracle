import express from 'express';
import { webhookRateLimiter } from './middleware/rate-limiter.js';
import { validateWebhookSignature } from './middleware/validate-webhook.js';
import { errorHandler } from './middleware/error-handler.js';
import { handleWebhook } from './controllers/webhook.controller.js';
import { healthCheck } from './controllers/health.controller.js';

export function createApp(): express.Application {
  const app = express();

  app.use(express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString();
    },
  }));

  app.get('/health', healthCheck);

  app.post(
    '/webhook',
    webhookRateLimiter,
    validateWebhookSignature,
    handleWebhook,
  );

  app.use(errorHandler);

  return app;
}
