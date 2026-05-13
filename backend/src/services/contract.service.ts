import {
  SorobanRpc,
  Contract,
  Keypair,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  BASE_FEE,
  xdr,
} from '@stellar/stellar-sdk';
import { loadConfig } from '../config/index.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/errors.js';

export class ContractService {
  private readonly server: SorobanRpc.Server;
  private readonly keypair: Keypair;
  private readonly contract: Contract;
  private readonly networkPassphrase: string;

  constructor() {
    const config = loadConfig();

    this.server = new SorobanRpc.Server(config.contract.rpcUrl);
    this.keypair = Keypair.fromSecret(config.contract.oracleSecretKey);
    this.contract = new Contract(config.contract.address);
    this.networkPassphrase = config.contract.networkPassphrase;
  }

  async isAlreadyPaid(issueId: number): Promise<boolean> {
    try {
      const sourceAccount = await this.server.getAccount(
        this.keypair.publicKey(),
      );

      const args: xdr.ScVal[] = [
        nativeToScVal(issueId, { type: 'u64' }),
      ];
      const operation = this.contract.call('paid', ...args);

      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const result = await this.server.simulateTransaction(tx);

      if (!result.result?.retval) {
        return false;
      }

      return scValToNative(result.result.retval) as boolean;
    } catch (error) {
      logger.error({ error, issueId }, 'Failed to check paid status');
      throw new AppError(
        `Failed to check paid status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        502,
        'CONTRACT_ERROR',
      );
    }
  }

  async releaseReward(
    contributorAddress: string,
    issueId: number,
    amountStroops: bigint,
  ): Promise<string> {
    logger.info(
      { contributorAddress, issueId, amount: amountStroops.toString() },
      'Submitting reward transaction',
    );

    const alreadyPaid = await this.isAlreadyPaid(issueId);
    if (alreadyPaid) {
      throw new AppError(
        `Issue ${issueId} has already been rewarded`,
        409,
        'ALREADY_PAID',
      );
    }

    try {
      const sourceAccount = await this.server.getAccount(
        this.keypair.publicKey(),
      );

      const args: xdr.ScVal[] = [
        nativeToScVal(contributorAddress, { type: 'address' }),
        nativeToScVal(issueId, { type: 'u64' }),
        nativeToScVal(amountStroops, { type: 'i128' }),
      ];
      const operation = this.contract.call('release_reward', ...args);

      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulateResponse = await this.server.simulateTransaction(tx);

      if (!simulateResponse || simulateResponse.error) {
        throw new AppError(
          `Transaction simulation failed: ${simulateResponse?.error ?? 'Unknown'}`,
          502,
          'CONTRACT_ERROR',
        );
      }

      const preparedTx = SorobanRpc.assembleTransaction(
        tx,
        simulateResponse,
      ) as SorobanRpc.RawTransaction;

      preparedTx.sign(this.keypair);

      const sendResponse = await this.server.sendTransaction(preparedTx);

      if (sendResponse.status === 'ERROR' || sendResponse.status === 'FAILED') {
        throw new AppError(
          `Transaction failed to send: ${JSON.stringify(sendResponse)}`,
          502,
          'CONTRACT_ERROR',
        );
      }

      const hash = sendResponse.hash;
      logger.info({ txHash: hash, issueId }, 'Transaction submitted');

      const receipt = await this.server.getTransaction(hash);

      if (!receipt) {
        throw new AppError('Transaction receipt not found', 502, 'CONTRACT_ERROR');
      }

      logger.info(
        { txHash: hash, status: receipt.status, issueId },
        'Reward transaction confirmed',
      );

      return hash;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, issueId }, 'Contract transaction failed');
      throw new AppError(
        `Failed to release reward: ${error instanceof Error ? error.message : 'Unknown error'}`,
        502,
        'CONTRACT_ERROR',
      );
    }
  }
}
