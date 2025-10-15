/**
 * Interface for Token-related operations
 * All token services must implement this interface
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
import type { SignerRef } from '../signing/signing-service.interface';

/**
 * Result of token operations
 */
export interface TokenOperationResult {
  transactionId: string;
  success: boolean;
  tokenId?: string;
  receipt: {
    status: {
      status: 'pending' | 'success' | 'failed';
      transactionId: string;
      error?: string;
    };
  };
}

export interface TokenService {
  /**
   * Create a token transfer transaction (without execution)
   */
  createTransferTransaction(params: TokenTransferParams): TransferTransaction;

  /**
   * Create and execute a token transfer transaction
   */
  transfer(
    params: TokenTransferParams,
    signer?: SignerRef,
  ): Promise<TokenOperationResult>;

  /**
   * Create a token creation transaction (without execution)
   */
  createTokenTransaction(params: TokenCreateParams): TokenCreateTransaction;

  /**
   * Create and execute a token creation transaction
   */
  createToken(
    params: TokenCreateParams,
    signer?: SignerRef,
  ): Promise<TokenOperationResult>;

  /**
   * Create a token association transaction (without execution)
   */
  createTokenAssociationTransaction(
    params: TokenAssociationParams,
  ): TokenAssociateTransaction;

  /**
   * Create and execute a token association transaction
   */
  associateToken(
    params: TokenAssociationParams,
    signer?: SignerRef,
  ): Promise<TokenOperationResult>;
}
