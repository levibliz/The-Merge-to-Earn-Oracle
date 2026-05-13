import rateLimit from 'express-rate-limit';
import { loadConfig } from '../config/index.js';

const config = loadConfig();

export const webhookRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
});
