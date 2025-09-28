/**
 * Interface for Account-related transaction operations
 * All account transaction services must implement this interface
 */
export interface AccountTransactionService {
  /**
   * Create a new Hedera account
   */
  createAccount(params: CreateAccountParams): Promise<AccountCreateResult>;

  /**
   * Get account information (creates a transaction to query account info)
   */
  getAccountInfo(accountId: string): Promise<AccountInfoQuery>;

  /**
   * Get account balance (creates a transaction to query balance)
   */
  getAccountBalance(
    accountId: string,
    tokenId?: string,
  ): Promise<AccountBalanceQuery>;
}

export interface AccountCreateResult {
  transaction: AccountCreateTransaction;
  privateKey: string;
  publicKey: string;
  evmAddress: string;
}

// Parameter types for account operations
export interface CreateAccountParams {
  balance: number;
  name: string;
  maxAutoAssociations?: number;
  keyType?: 'ECDSA' | 'ED25519';
}

// Import Hedera SDK types
import {
  AccountCreateTransaction,
  AccountInfoQuery,
  AccountBalanceQuery,
} from '@hashgraph/sdk';
