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

  /**
   * Helper function to prepare TransactionResult based on receipt contents
   * Extracts transaction-specific fields from the receipt
   */
  private prepareTransactionResult(
    response: TransactionResponse,
    receipt: TransactionReceipt,
  ): TransactionResult {
    const transactionId = response.transactionId.toString();
    const success = receipt.status === Status.Success;

    // Base result object
    const result: TransactionResult = {
      transactionId,
      success,
      receipt: {
        status: {
          status: success ? 'success' : 'failed',
          transactionId,
        },
      },
    };

    // Extract accountId for account creation transactions
    if (receipt.accountId) {
      result.accountId = receipt.accountId.toString();
      this.logger.debug(`[SIGNING] Extracted accountId: ${result.accountId}`);
    }

    // Extract tokenId for token creation transactions
    if (receipt.tokenId) {
      result.tokenId = receipt.tokenId.toString();
      this.logger.debug(`[SIGNING] Extracted tokenId: ${result.tokenId}`);
    }

    // Extract topicId for topic creation transactions
    if (receipt.topicId) {
      result.topicId = receipt.topicId.toString();
      this.logger.debug(`[SIGNING] Extracted topicId: ${result.topicId}`);
    }

    // Extract topicSequenceNumber for topic message submit transactions
    if (
      receipt.topicSequenceNumber !== undefined &&
      receipt.topicSequenceNumber !== null
    ) {
      result.topicSequenceNumber = Number(receipt.topicSequenceNumber);
      this.logger.debug(
        `[SIGNING] Extracted topicSequenceNumber: ${result.topicSequenceNumber}`,
      );
    }

    return result;
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

      // Use helper to prepare the result based on transaction type
      return this.prepareTransactionResult(response, receipt);
    } catch (error) {
      console.error(`[SIGNING] Transaction execution failed:`, error);
      throw error;
    }
  }

  /**
   * Sign and execute a transaction using a specific private key
   */
  async signAndExecuteWithKey(
    transaction: any,
    privateKey: string,
  ): Promise<TransactionResult> {
    this.logger.debug(
      `[SIGNING] Signing and executing transaction with custom key`,
    );

    try {
      // Parse the private key
      const customKey = PrivateKey.fromString(privateKey);

      // Freeze the transaction first
      transaction.freezeWith(this.client);

      // Sign with the custom key
      transaction.sign(customKey);

      // Execute the signed transaction
      const response: TransactionResponse = await transaction.execute(
        this.client,
      );
      const receipt: TransactionReceipt = await response.getReceipt(
        this.client,
      );

      this.logger.debug(
        `[SIGNING] Transaction executed successfully with custom key: ${response.transactionId}`,
      );

      // Use helper to prepare the result based on transaction type
      return this.prepareTransactionResult(response, receipt);
    } catch (error) {
      console.error(
        `[SIGNING] Transaction execution with custom key failed:`,
        error,
      );
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
   * Sign a transaction using a specific private key without executing it
   */
  async signWithKey(
    transaction: any,
    privateKey: string,
  ): Promise<SignedTransaction> {
    this.logger.debug(`[SIGNING] Signing transaction with custom key`);

    try {
      // Parse the private key
      const customKey = PrivateKey.fromString(privateKey);

      // Freeze the transaction first
      transaction.freezeWith(this.client);

      // Sign the transaction with the custom key
      const signedTransaction = await transaction.sign(customKey);

      return {
        transactionId: `signed-${Date.now()}`,
      };
    } catch (error) {
      console.error(
        `[SIGNING] Transaction signing with custom key failed:`,
        error,
      );
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
