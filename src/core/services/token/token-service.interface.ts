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

/**
 * Signer reference for transaction signing
 */
export interface SignerRef {
  keyRefId?: string;
  publicKey?: string;
}

export interface TokenService {
  /**
   * Create a token transfer transaction (without execution)
   */
  createTransferTransaction(
    params: TokenTransferParams,
  ): Promise<TransferTransaction>;

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
  createTokenTransaction(
    params: TokenCreateParams,
  ): Promise<TokenCreateTransaction>;

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
  ): Promise<TokenAssociateTransaction>;

  /**
   * Create and execute a token association transaction
   */
  associateToken(
    params: TokenAssociationParams,
    signer?: SignerRef,
  ): Promise<TokenOperationResult>;
}
