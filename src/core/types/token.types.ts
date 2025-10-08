/**
 * Token Transaction Type Definitions
 * Type definitions for token-related operations
 */

/**
 * Parameters for token transfer transactions
 */
export interface TokenTransferParams {
  tokenId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

/**
 * Custom fee configuration for tokens
 */
export interface CustomFee {
  type: 'fixed'; // Only fixed fees supported
  amount: number; // Required for fixed fees
  unitType?: 'HBAR'; // Only HBAR supported, defaults to HBAR
  collectorId?: string;
  exempt?: boolean;
}

/**
 * Parameters for token creation transactions
 */
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

/**
 * Parameters for token association transactions
 */
export interface TokenAssociationParams {
  tokenId: string;
  accountId: string;
}
