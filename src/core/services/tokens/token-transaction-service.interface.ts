/**
 * Interface for Token-related transaction operations
 * All token transaction services must implement this interface
 */
import {
  TransferTransaction,
  TokenCreateTransaction,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';

export interface TokenTransactionService {
  /**
   * Create a token transfer transaction
   */
  createTransferTransaction(
    params: TokenTransferParams,
  ): Promise<TransferTransaction>;

  /**
   * Create a token creation transaction
   */
  createTokenTransaction(
    params: TokenCreateParams,
  ): Promise<TokenCreateTransaction>;

  /**
   * Create a token association transaction
   */
  createTokenAssociationTransaction(
    params: TokenAssociationParams,
  ): Promise<TokenAssociateTransaction>;
}

export interface TokenTransferParams {
  tokenId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export interface TokenCreateParams {
  name: string;
  symbol: string;
  treasuryId: string;
  decimals: number;
  initialSupply: number;
  supplyType: 'FINITE' | 'INFINITE';
  adminKey: string;
  treasuryKey: string;
}

export interface TokenAssociationParams {
  tokenId: string;
  accountId: string;
}
