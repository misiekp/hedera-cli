/**
 * Real implementation of Signing Service
 * Uses Hedera SDK to sign and execute transactions
 */
import {
  TransactionService,
  TransactionResult,
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

export class TransactionServiceImpl implements TransactionService {
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
  }

  /**
   * Get a fresh Hedera client for the current network
   */
  private getClient(): Client {
    this.logger.debug('[SIGNING] Creating client for current network');

    // Get current network from NetworkService
    const network = this.networkService.getCurrentNetwork();

    // Use credentials-state to create client without exposing private keys
    return this.credentialsState.createClient(network);
  }

  /**
   * Sign and execute a transaction in one operation
   */
  async signAndExecute(
    transaction: HederaTransaction,
  ): Promise<TransactionResult> {
    this.logger.debug(`[SIGNING] Signing and executing transaction`);

    try {
      // Get fresh client for current network
      const client = this.getClient();

      // Get default operator keyRefId for signing
      const mapping =
        this.credentialsState.getDefaultOperator() ||
        this.credentialsState.ensureDefaultFromEnv();
      if (!mapping) {
        throw new Error('[SIGNING] No default operator configured');
      }

      transaction.freezeWith(client);

      // Sign using credentials-state without exposing private key
      await this.credentialsState.signTransaction(
        transaction,
        mapping.keyRefId,
      );

      // Execute the transaction
      const response: TransactionResponse = await transaction.execute(client);
      const receipt: TransactionReceipt = await response.getReceipt(client);

      this.logger.debug(
        `[SIGNING] Transaction executed successfully: ${response.transactionId.toString()}`,
      );

      // Extract IDs from receipt based on transaction type
      let accountId: string | undefined;
      let tokenId: string | undefined;

      if (receipt.accountId) {
        accountId = receipt.accountId.toString();
      }

      if (receipt.tokenId) {
        tokenId = receipt.tokenId.toString();
      }

      // Extract topic ID for topic creation transactions
      let topicId: string | undefined;
      if (receipt.topicId) {
        topicId = receipt.topicId.toString();
      }

      return {
        transactionId: response.transactionId.toString(),
        success: receipt.status === Status.Success,
        accountId,
        tokenId,
        topicId,
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

  // New API: minimal delegations to preserve behavior
  async signAndExecuteWith(
    transaction: HederaTransaction,
    signer: SignerRef,
  ): Promise<TransactionResult> {
    // Get fresh client for current network
    const client = this.getClient();
    const keyRefId = this.resolveSignerRef(signer);

    transaction.freezeWith(client);

    // Sign using credentials-state without exposing private key
    await this.credentialsState.signTransaction(transaction, keyRefId);

    // Execute the transaction
    const response: TransactionResponse = await transaction.execute(client);
    const receipt: TransactionReceipt = await response.getReceipt(client);

    // Extract topic ID for topic creation transactions
    let topicId: string | undefined;
    if (receipt.topicId) {
      topicId = receipt.topicId.toString();
    }

    // Extract IDs from receipt based on transaction type
    let accountId: string | undefined;
    let tokenId: string | undefined;

    if (receipt.accountId) {
      accountId = receipt.accountId.toString();
    }

    if (receipt.tokenId) {
      tokenId = receipt.tokenId.toString();
    }

    return {
      transactionId: response.transactionId.toString(),
      success: receipt.status === Status.Success,
      accountId,
      tokenId,
      topicId,
      receipt: {
        status: {
          status: receipt.status === Status.Success ? 'success' : 'failed',
          transactionId: response.transactionId.toString(),
        },
      },
    };
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
}
