/**
 * Real implementation of Account Transaction Service
 * Uses Hedera SDK to create actual transactions and queries
 */
import { createHash } from 'crypto';
import {
  AccountCreateTransaction,
  AccountInfoQuery,
  AccountBalanceQuery,
  AccountId,
  PublicKey,
  Hbar,
} from '@hashgraph/sdk';
import {
  AccountService,
  CreateAccountParams,
  AccountCreateResult,
} from './account-transaction-service.interface';
import { Logger } from '../logger/logger-service.interface';

export class AccountServiceImpl implements AccountService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }
  /**
   * Create a new Hedera account
   */
  createAccount(params: CreateAccountParams): Promise<AccountCreateResult> {
    this.logger.debug(
      `[ACCOUNT TX] Creating account with params: ${JSON.stringify(params)}`,
    );

    const balance = Hbar.fromTinybars(params.balanceRaw);

    // Create the account creation transaction
    const transaction = new AccountCreateTransaction()
      .setECDSAKeyWithAlias(PublicKey.fromString(params.publicKey))
      .setInitialBalance(balance || 0);

    // Set max automatic token associations if specified
    if (params.maxAutoAssociations && params.maxAutoAssociations > 0) {
      transaction.setMaxAutomaticTokenAssociations(params.maxAutoAssociations);
    }

    // Generate EVM address from the public key
    const evmAddress = this.generateEvmAddress(params.publicKey);

    this.logger.debug(
      `[ACCOUNT TX] Created transaction for account with key: ${params.publicKey}`,
    );

    return Promise.resolve({
      transaction,
      publicKey: params.publicKey,
      evmAddress,
    });
  }

  private generateEvmAddress(publicKeyString: string): string {
    // This is a simplified EVM address generation
    // In a real implementation, you'd use proper cryptographic methods
    const hash = createHash('sha256').update(publicKeyString).digest('hex');
    return '0x' + hash.substring(0, 40);
  }

  /**
   * Get account information
   */
  getAccountInfo(accountId: string): Promise<AccountInfoQuery> {
    this.logger.debug(`[ACCOUNT TX] Getting account info for: ${accountId}`);

    // Create account info query
    const query = new AccountInfoQuery().setAccountId(
      AccountId.fromString(accountId),
    );

    this.logger.debug(
      `[ACCOUNT TX] Created account info query for: ${accountId}`,
    );
    return Promise.resolve(query);
  }

  /**
   * Get account balance
   */
  getAccountBalance(
    accountId: string,
    tokenId?: string,
  ): Promise<AccountBalanceQuery> {
    this.logger.debug(
      `[ACCOUNT TX] Getting account balance for: ${accountId}${tokenId ? `, token: ${tokenId}` : ''}`,
    );

    // Create account balance query
    const query = new AccountBalanceQuery().setAccountId(
      AccountId.fromString(accountId),
    );

    // Note: AccountBalanceQuery doesn't support token-specific queries
    // Token balances are included in the general account balance response
    if (tokenId) {
      this.logger.debug(
        `[ACCOUNT TX] Note: Token ID ${tokenId} specified but AccountBalanceQuery returns all token balances`,
      );
    }

    this.logger.debug(
      `[ACCOUNT TX] Created account balance query for: ${accountId}`,
    );
    return Promise.resolve(query);
  }
}
