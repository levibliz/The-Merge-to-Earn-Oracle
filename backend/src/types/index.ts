export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  port: number;
  host: string;
  env: Environment;
  logLevel: string;
  github: {
    webhookSecret: string;
    token: string;
  };
  contract: {
    rpcUrl: string;
    address: string;
    oracleSecretKey: string;
    tokenAddress: string;
    networkPassphrase: string;
  };
  reward: {
    pricePerPoint: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}
