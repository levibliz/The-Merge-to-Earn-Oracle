import pino from 'pino';
import { loadConfig } from './index.js';

const config = loadConfig();

export const logger = pino({
  level: config.logLevel,
  transport:
    config.env === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  redact: {
    paths: ['req.headers.authorization', 'req.headers["x-hub-signature-256"]'],
    censor: '[REDACTED]',
  },
});
