export interface RewardResult {
  issueId: number;
  contributor: string;
  contributorAddress: string;
  points: number;
  amount: string;
  txHash: string;
}

export interface ContractConfig {
  rpcUrl: string;
  address: string;
  oracleSecretKey: string;
  tokenAddress: string;
  networkPassphrase: string;
}
