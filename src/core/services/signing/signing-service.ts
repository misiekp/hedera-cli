/**
 * Real implementation of Signing Service
 * Uses Hedera SDK to sign and execute transactions
 */
import {
  SigningService,
  SignedTransaction,
  TransactionResult,
  TransactionStatus,
} from './signing-service.interface';
import { Logger } from '../logger/logger-service.interface';
import { CredentialsService } from '../credentials/credentials-service.interface';
import {
  Client,
  PrivateKey,
  AccountId,
  TransactionResponse,
  TransactionReceipt,
  Status,
  Transaction as HederaTransaction,
} from '@hashgraph/sdk';
import { formatError } from '../../../utils/errors';

export class SigningServiceImpl implements SigningService {
  private client!: Client;
  private operatorKey!: PrivateKey;
  private operatorId!: AccountId;
  private logger: Logger;
  private credentialsService: CredentialsService;

  constructor(logger: Logger, credentialsService: CredentialsService) {
    this.logger = logger;
    this.credentialsService = credentialsService;

    // Initialize with credentials from state or environment
    void this.initializeCredentials();
  }

  private async initializeCredentials(): Promise<void> {
    this.logger.debug('[SIGNING] Initializing credentials');

    try {
      // Try to get credentials from state or environment
      const credentials = await this.credentialsService.getDefaultCredentials();

      if (credentials) {
        this.logger.debug(
          `[SIGNING] Using credentials for account: ${credentials.accountId}`,
        );
        this.operatorId = AccountId.fromString(credentials.accountId);
        this.operatorKey = PrivateKey.fromString(credentials.privateKey);

        // Set up client based on network
        if (credentials.network === 'mainnet') {
          this.client = Client.forMainnet().setOperator(
            this.operatorId,
            this.operatorKey,
          );
        } else {
          this.client = Client.forTestnet().setOperator(
            this.operatorId,
            this.operatorKey,
          );
        }
      } else {
        // Fallback to mock credentials for development
        this.logger.debug(
          '[SIGNING] No credentials found, using mock credentials',
        );
        this.operatorKey = PrivateKey.generate();
        this.operatorId = AccountId.fromString('0.0.123456'); // Mock operator account

        this.client = Client.forTestnet().setOperator(
          this.operatorId,
          this.operatorKey,
        );
      }
    } catch (error) {
      this.logger.error(
        formatError('[SIGNING] Failed to initialize credentials: ', error),
      );
      // Fallback to mock credentials
      this.operatorKey = PrivateKey.generate();
      this.operatorId = AccountId.fromString('0.0.123456');
      this.client = Client.forTestnet().setOperator(
        this.operatorId,
        this.operatorKey,
      );
    }
  }

  /**
   * Sign and execute a transaction in one operation
   */
  async signAndExecute(
    transaction: HederaTransaction,
  ): Promise<TransactionResult> {
    this.logger.debug(`[SIGNING] Signing and executing transaction`);

    try {
      // Execute the transaction
      const response: TransactionResponse = await transaction.execute(
        this.client,
      );
      const receipt: TransactionReceipt = await response.getReceipt(
        this.client,
      );

      this.logger.debug(
        `[SIGNING] Transaction executed successfully: ${response.transactionId.toString()}`,
      );

      // Extract account ID for account creation transactions
      let accountId: string | undefined;
      if (receipt.accountId) {
        accountId = receipt.accountId.toString();
      }

      return {
        transactionId: response.transactionId.toString(),
        success: receipt.status === Status.Success,
        accountId,
        receipt: {
          status: {
            status: receipt.status === Status.Success ? 'success' : 'failed',
            transactionId: response.transactionId.toString(),
          },
        },
      };
    } catch (error) {
      console.error(`[SIGNING] Transaction execution failed:`, error);
      throw error;
    }
  }

  /**
   * Sign a transaction without executing it
   */
  async sign(transaction: HederaTransaction): Promise<SignedTransaction> {
    this.logger.debug(`[SIGNING] Signing transaction`);

    try {
      // Freeze the transaction first
      transaction.freezeWith(this.client);

      // Sign the transaction
      await transaction.sign(this.operatorKey);

      return {
        transactionId: `signed-${Date.now()}`,
      };
    } catch (error) {
      console.error(`[SIGNING] Transaction signing failed:`, error);
      throw error;
    }
  }

  /**
   * Execute a pre-signed transaction
   */
  execute(signedTransaction: SignedTransaction): Promise<TransactionResult> {
    this.logger.debug(
      `[SIGNING] Executing signed transaction: ${signedTransaction.transactionId}`,
    );

    try {
      // Execute the signed transaction
      // Note: In a real implementation, we would need to store the signed transaction
      // For now, we'll throw an error as this is not fully implemented
      throw new Error(
        'Execute method not fully implemented - signed transaction storage required',
      );
    } catch (error) {
      console.error(`[SIGNING] Transaction execution failed:`, error);
      throw error;
    }
  }

  /**
   * Get the status of a transaction
   */
  getStatus(transactionId: string): Promise<TransactionStatus> {
    this.logger.debug(
      `[SIGNING] Getting status for transaction: ${transactionId}`,
    );

    try {
      // In a real implementation, you would query the network for transaction status
      // For now, we'll return a mock status
      return Promise.resolve({
        status: 'success',
        transactionId,
      });
    } catch (error) {
      console.error(`[SIGNING] Failed to get transaction status:`, error);
      throw error;
    }
  }
}
