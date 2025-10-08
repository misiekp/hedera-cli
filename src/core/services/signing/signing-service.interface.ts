import type { Transaction as HederaTransaction } from '@hashgraph/sdk';

/**
 * Interface for transaction signing and execution
 * All signing services must implement this interface
 */
export interface SigningService {
  /**
   * Sign and execute a transaction in one operation
   */
  signAndExecute(transaction: HederaTransaction): Promise<TransactionResult>;

  /**
   * Sign and execute a transaction using a specific private key
   */
  signAndExecuteWithKey(
    transaction: any,
    privateKey: string,
  ): Promise<TransactionResult>;

  /**
   * Sign a transaction without executing it
   */
  sign(transaction: HederaTransaction): Promise<SignedTransaction>;

  /**
   * Sign a transaction using a specific private key without executing it
   */
  signWithKey(transaction: any, privateKey: string): Promise<SignedTransaction>;

  /**
   * Execute a pre-signed transaction
   */
  execute(signedTransaction: SignedTransaction): Promise<TransactionResult>;

  /**
   * Get the status of a transaction
   */
  getStatus(transactionId: string): Promise<TransactionStatus>;
}

// Result types
export interface TransactionResult {
  transactionId: string;
  success: boolean;
  receipt: TransactionReceipt;
  accountId?: string;
  tokenId?: string;
  topicId?: string;
  topicSequenceNumber?: number;
}

export interface SignedTransaction {
  transactionId: string;
  // Additional signed transaction properties will be implementation-specific
}

export interface TransactionStatus {
  status: 'pending' | 'success' | 'failed';
  transactionId: string;
  error?: string;
}

export interface TransactionReceipt {
  status: TransactionStatus;
  accountId?: string;
  tokenId?: string;
  topicId?: string;
  topicSequenceNumber?: number;
}

// Generic transaction interface
export interface Transaction {
  freeze(): Promise<Transaction>;
  sign(key: string): Promise<Transaction>;
  execute(): Promise<TransactionResponse>;
}

export interface TransactionResponse {
  transactionId: string;
  getReceipt(): Promise<TransactionReceipt>;
}
