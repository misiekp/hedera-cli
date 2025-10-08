/**
 * Interface for Token-related transaction operations
 * All token transaction services must implement this interface
 */
import {
  TransferTransaction,
  TokenCreateTransaction,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';
import type {
  TokenTransferParams,
  TokenCreateParams,
  TokenAssociationParams,
} from '../../types/token.types';

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
