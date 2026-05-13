import type { AppConfig, Environment } from '../types/index.js';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseEnv<T>(name: string, parser: (v: string) => T, fallback: T): T {
  const value = process.env[name];
  if (value === undefined) return fallback;
  try {
    return parser(value);
  } catch {
    return fallback;
  }
}

export function loadConfig(): AppConfig {
  return {
    port: parseEnv('PORT', Number, 3001),
    host: process.env['HOST'] ?? '0.0.0.0',
    env: (process.env['NODE_ENV'] as Environment) ?? 'development',
    logLevel: process.env['LOG_LEVEL'] ?? 'info',
    github: {
      webhookSecret: requiredEnv('GITHUB_WEBHOOK_SECRET'),
      token: requiredEnv('GITHUB_TOKEN'),
    },
    contract: {
      rpcUrl: requiredEnv('RPC_URL'),
      address: requiredEnv('CONTRACT_ADDRESS'),
      oraclePrivateKey: requiredEnv('ORACLE_PRIVATE_KEY'),
    },
    reward: {
      pricePerPoint: parseEnv('PRICE_PER_POINT', Number, 0.001),
    },
    rateLimit: {
      windowMs: parseEnv('RATE_LIMIT_WINDOW_MS', Number, 60000),
      maxRequests: parseEnv('RATE_LIMIT_MAX_REQUESTS', Number, 100),
    },
  };
}
