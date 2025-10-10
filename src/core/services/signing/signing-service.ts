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
import { KeyManagementService } from '../credentials-state/credentials-state-service.interface';
import { NetworkService } from '../network/network-service.interface';
import type { SignerRef } from './signing-service.interface';
import {
  Client,
  TransactionResponse,
  TransactionReceipt,
  Status,
  Transaction as HederaTransaction,
} from '@hashgraph/sdk';

export class SigningServiceImpl implements SigningService {
  private client!: Client;
  private logger: Logger;
  private credentialsState: KeyManagementService;
  private networkService: NetworkService;

  constructor(
    logger: Logger,
    credentialsState: KeyManagementService,
    networkService: NetworkService,
  ) {
    this.logger = logger;
    this.credentialsState = credentialsState;
    this.networkService = networkService;

    // Initialize with credentials from state or environment
    void this.initializeCredentials();
  }

  private initializeCredentials(): void {
    this.logger.debug('[SIGNING] Initializing credentials');

    // Get network from NetworkService
    const currentNetwork = this.networkService.getCurrentNetwork();
    const network = currentNetwork as 'mainnet' | 'testnet' | 'previewnet';

    // Use credentials-state to create client without exposing private keys
    this.client = this.credentialsState.createClient(network);
  }

  /**
   * Sign and execute a transaction in one operation
   */
  async signAndExecute(
    transaction: HederaTransaction,
  ): Promise<TransactionResult> {
    this.logger.debug(`[SIGNING] Signing and executing transaction`);

    try {
      // Get default operator keyRefId for signing
      const mapping =
        this.credentialsState.getDefaultOperator() ||
        this.credentialsState.ensureDefaultFromEnv();
      if (!mapping) {
        throw new Error('[SIGNING] No default operator configured');
      }

      transaction.freezeWith(this.client);

      // Sign using credentials-state without exposing private key
      await this.credentialsState.signTransaction(
        transaction,
        mapping.keyRefId,
      );

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
      // Get default operator keyRefId for signing
      const mapping =
        this.credentialsState.getDefaultOperator() ||
        this.credentialsState.ensureDefaultFromEnv();
      if (!mapping) {
        throw new Error('[SIGNING] No default operator configured');
      }

      // Freeze the transaction first
      transaction.freezeWith(this.client);

      // Sign using credentials-state without exposing private key
      await this.credentialsState.signTransaction(
        transaction,
        mapping.keyRefId,
      );

      return {
        transactionId: `signed-${Date.now()}`,
      };
    } catch (error) {
      console.error(`[SIGNING] Transaction signing failed:`, error);
      throw error;
    }
  }

  // New API: minimal delegations to preserve behavior
  async signAndExecuteWith(
    transaction: HederaTransaction,
    signer: SignerRef,
  ): Promise<TransactionResult> {
    const keyRefId = this.resolveSignerRef(signer);

    transaction.freezeWith(this.client);

    // Sign using credentials-state without exposing private key
    await this.credentialsState.signTransaction(transaction, keyRefId);

    // Execute the transaction
    const response: TransactionResponse = await transaction.execute(
      this.client,
    );
    const receipt: TransactionReceipt = await response.getReceipt(this.client);

    return {
      transactionId: response.transactionId.toString(),
      success: receipt.status === Status.Success,
      receipt: {
        status: {
          status: receipt.status === Status.Success ? 'success' : 'failed',
          transactionId: response.transactionId.toString(),
        },
      },
    };
  }

  async signWith(
    transaction: HederaTransaction,
    signer: SignerRef,
  ): Promise<SignedTransaction> {
    const keyRefId = this.resolveSignerRef(signer);

    // Freeze the transaction first
    transaction.freezeWith(this.client);

    // Sign using credentials-state without exposing private key
    await this.credentialsState.signTransaction(transaction, keyRefId);

    return { transactionId: `signed-${Date.now()}` };
  }

  setDefaultSigner(): void {
    // TODO: Store default signer ref and reconfigure operator if applicable
    this.logger.debug('[SIGNING] setDefaultSigner called (stub)');
  }

  /**
   * Resolve a SignerRef to a keyRefId for signing.
   * Supports both keyRefId and publicKey directly.
   */
  private resolveSignerRef(signer: SignerRef): string {
    if (!signer) throw new Error('[SIGNING] signer ref is required');

    // If direct keyRefId provided, validate it exists
    if (signer.keyRefId) {
      const pub = this.credentialsState.getPublicKey(signer.keyRefId);
      if (!pub) {
        throw new Error(
          `[SIGNING] Unknown keyRefId: ${signer.keyRefId}. Use 'hcli keys list' to inspect available keys.`,
        );
      }
      return signer.keyRefId;
    }

    // If publicKey provided, find the corresponding keyRefId
    if (signer.publicKey) {
      const keyRefId = this.credentialsState.findByPublicKey(signer.publicKey);
      if (!keyRefId) {
        throw new Error(
          `[SIGNING] No keyRefId found for public key: ${signer.publicKey}`,
        );
      }
      return keyRefId;
    }

    throw new Error(
      '[SIGNING] SignerRef must provide either keyRefId or publicKey',
    );
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
