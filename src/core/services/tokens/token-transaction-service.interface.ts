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

export interface CustomFee {
  type: 'fixed'; // Only fixed fees supported
  amount: number; // Required for fixed fees
  unitType?: 'HBAR'; // Only HBAR supported, defaults to HBAR
  collectorId?: string;
  exempt?: boolean;
}

export interface TokenCreateParams {
  name: string;
  symbol: string;
  treasuryId: string;
  decimals: number;
  initialSupply: number;
  supplyType: 'FINITE' | 'INFINITE';
  maxSupply?: number; // Required for FINITE supply type
  adminKey: string;
  treasuryKey: string;
  customFees?: CustomFee[];
}

export interface TokenAssociationParams {
  tokenId: string;
  accountId: string;
}
