/**
 * Token Plugin State Schema
 * Single source of truth for token data structure and validation
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { SupportedNetwork } from '../../core/types/shared.types';

// Zod schema for token keys
export const TokenKeysSchema = z.object({
  adminKey: z.string().min(1, 'Admin key is required'),
  supplyKey: z.string().optional().default(''),
  wipeKey: z.string().optional().default(''),
  kycKey: z.string().optional().default(''),
  freezeKey: z.string().optional().default(''),
  pauseKey: z.string().optional().default(''),
  feeScheduleKey: z.string().optional().default(''),
  treasuryKey: z.string().min(1, 'Treasury key is required'),
});

// Zod schema for token association
export const TokenAssociationSchema = z.object({
  name: z.string().min(1, 'Association name is required'),
  accountId: z
    .string()
    .regex(/^0\.0\.[0-9]+$/, 'Account ID must be in format 0.0.123456'),
});

// Zod schema for custom fees
export const CustomFeeSchema = z.object({
  type: z.string(),
  unitType: z.string().optional(),
  amount: z.number().optional(),
  denom: z.string().optional(),
  numerator: z.number().optional(),
  denominator: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  collectorId: z.string().optional(),
  exempt: z.boolean().optional(),
});

// Main token data schema
export const TokenDataSchema = z.object({
  tokenId: z
    .string()
    .regex(/^0\.0\.[0-9]+$/, 'Token ID must be in format 0.0.123456'),

  name: z
    .string()
    .min(1, 'Token name is required')
    .max(100, 'Token name must be 100 characters or less'),

  symbol: z
    .string()
    .min(1, 'Token symbol is required')
    .max(10, 'Token symbol must be 10 characters or less'),

  treasuryId: z
    .string()
    .regex(/^0\.0\.[0-9]+$/, 'Treasury ID must be in format 0.0.123456'),

  decimals: z
    .number()
    .int('Decimals must be an integer')
    .min(0, 'Decimals must be non-negative')
    .max(255, 'Decimals must be 255 or less'),

  initialSupply: z
    .number()
    .int('Initial supply must be an integer')
    .min(0, 'Initial supply must be non-negative'),

  supplyType: z.enum(['FINITE', 'INFINITE'], {
    errorMap: () => ({
      message: 'Supply type must be either FINITE or INFINITE',
    }),
  }),

  maxSupply: z
    .number()
    .int('Max supply must be an integer')
    .min(0, 'Max supply must be non-negative'),

  keys: TokenKeysSchema,

  network: z.enum(['mainnet', 'testnet', 'previewnet', 'localnet'], {
    errorMap: () => ({
      message: 'Network must be mainnet, testnet, previewnet, or localnet',
    }),
  }),

  associations: z.array(TokenAssociationSchema).default([]),

  customFees: z.array(CustomFeeSchema).default([]),
});

// TypeScript type inferred from Zod schema
export type TokenData = z.infer<typeof TokenDataSchema>;
export type TokenKeys = z.infer<typeof TokenKeysSchema>;
export type TokenAssociation = z.infer<typeof TokenAssociationSchema>;
export type CustomFee = z.infer<typeof CustomFeeSchema>;

// Namespace constant
export const TOKEN_NAMESPACE = 'token-tokens';

// JSON Schema for manifest (automatically generated from Zod schema)
export const TOKEN_JSON_SCHEMA = zodToJsonSchema(TokenDataSchema);

/**
 * Validate token data using Zod schema
 */
export function validateTokenData(data: unknown): data is TokenData {
  try {
    TokenDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse and validate token data with detailed error messages
 */
export function parseTokenData(data: unknown): TokenData {
  return TokenDataSchema.parse(data);
}

/**
 * Safe parse token data (returns success/error instead of throwing)
 */
export function safeParseTokenData(data: unknown) {
  return TokenDataSchema.safeParse(data);
}

// Command parameter validation schemas
export const TokenCreateCommandSchema = z.object({
  name: z
    .string()
    .min(1, 'Token name is required')
    .max(100, 'Token name must be 100 characters or less'),

  symbol: z
    .string()
    .min(1, 'Token symbol is required')
    .max(10, 'Token symbol must be 10 characters or less'),

  treasury: z
    .string()
    .min(1, 'Treasury is required (either alias or treasury-id:treasury-key)')
    .optional(),

  decimals: z
    .number()
    .int('Decimals must be an integer')
    .min(0, 'Decimals must be non-negative')
    .max(255, 'Decimals must be 255 or less')
    .optional(),

  initialSupply: z
    .number()
    .int('Initial supply must be an integer')
    .min(0, 'Initial supply must be non-negative')
    .optional(),

  supplyType: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(z.enum(['FINITE', 'INFINITE']))
    .optional(),

  maxSupply: z
    .number()
    .int('Max supply must be an integer')
    .min(0, 'Max supply must be non-negative')
    .optional(),

  adminKey: z.string().min(1, 'Admin key is required').optional(),
});

export type TokenCreateCommandParams = z.infer<typeof TokenCreateCommandSchema>;

/**
 * Validate token create command parameters
 */
export function validateTokenCreateParams(
  data: unknown,
): TokenCreateCommandParams {
  return TokenCreateCommandSchema.parse(data);
}

/**
 * Safe validate token create command parameters
 */
export function safeValidateTokenCreateParams(data: unknown) {
  return TokenCreateCommandSchema.safeParse(data);
}

// Command parameter validation schema for associate command
export const TokenAssociateCommandSchema = z.object({
  tokenId: z
    .string()
    .regex(/^0\.0\.[0-9]+$/, 'Token ID must be in format 0.0.123456'),

  account: z
    .string()
    .min(1, 'Account is required (either alias or account-id:account-key)'),
});

export type TokenAssociateCommandParams = z.infer<
  typeof TokenAssociateCommandSchema
>;

/**
 * Validate token associate command parameters
 */
export function validateTokenAssociateParams(
  data: unknown,
): TokenAssociateCommandParams {
  return TokenAssociateCommandSchema.parse(data);
}

/**
 * Safe validate token associate command parameters
 */
export function safeValidateTokenAssociateParams(data: unknown) {
  return TokenAssociateCommandSchema.safeParse(data);
}

// Command parameter validation schema for transfer command
export const TokenTransferCommandSchema = z.object({
  tokenId: z
    .string()
    .regex(/^0\.0\.[0-9]+$/, 'Token ID must be in format 0.0.123456'),

  from: z
    .string()
    .min(
      1,
      'From account is required (either alias or account-id:private-key)',
    ),

  to: z.string().min(1, 'To account is required (either alias or account-id)'),

  balance: z.number().positive('Balance must be a positive number'),
});

export type TokenTransferCommandParams = z.infer<
  typeof TokenTransferCommandSchema
>;

/**
 * Validate token transfer command parameters
 */
export function validateTokenTransferParams(
  data: unknown,
): TokenTransferCommandParams {
  return TokenTransferCommandSchema.parse(data);
}

/**
 * Safe validate token transfer command parameters
 */
export function safeValidateTokenTransferParams(data: unknown) {
  return TokenTransferCommandSchema.safeParse(data);
}

/**
 * Resolved treasury information
 */
export interface ResolvedTreasury {
  treasuryId: string;
  treasuryKeyRefId: string;
  treasuryPublicKey: string;
}

/**
 * Parse and resolve treasury parameter
 * Can be:
 * - An alias (resolved via alias service)
 * - A treasury-id:treasury-key pair
 *
 * @param treasury - Treasury parameter from command
 * @param api - Core API instance
 * @param network - Current network
 * @returns Resolved treasury information
 */
export async function resolveTreasuryParameter(
  treasury: string | undefined,
  api: any,
  network: SupportedNetwork,
): Promise<ResolvedTreasury | null> {
  if (!treasury) {
    return null;
  }

  // Check if it's a treasury-id:treasury-key pair
  if (treasury.includes(':')) {
    const parts = treasury.split(':');
    if (parts.length === 2) {
      const [treasuryId, treasuryKey] = parts;

      // Validate treasury ID format
      const accountIdPattern = /^0\.0\.\d+$/;
      if (!accountIdPattern.test(treasuryId)) {
        throw new Error(
          `Invalid treasury ID format: ${treasuryId}. Expected format: 0.0.123456`,
        );
      }

      // Import the treasury key
      const imported = api.credentialsState.importPrivateKey(treasuryKey);

      return {
        treasuryId,
        treasuryKeyRefId: imported.keyRefId,
        treasuryPublicKey: imported.publicKey,
      };
    } else {
      throw new Error(
        'Invalid treasury format. Expected either an alias or treasury-id:treasury-key',
      );
    }
  }

  // Try to resolve as an alias
  const aliasRecord = api.alias.resolve(treasury, 'account', network);
  if (!aliasRecord) {
    throw new Error(
      `Treasury alias "${treasury}" not found for network ${network}. ` +
        'Please provide either a valid alias or treasury-id:treasury-key pair.',
    );
  }

  // Get the account ID and key from the alias
  if (!aliasRecord.entityId) {
    throw new Error(
      `Treasury alias "${treasury}" does not have an associated account ID`,
    );
  }

  if (!aliasRecord.keyRefId) {
    throw new Error(
      `Treasury alias "${treasury}" does not have an associated key`,
    );
  }

  // Get the public key
  const publicKey = api.credentialsState.getPublicKey(aliasRecord.keyRefId);
  if (!publicKey) {
    throw new Error(
      `Treasury alias "${treasury}" key not found in credentials state`,
    );
  }

  return {
    treasuryId: aliasRecord.entityId,
    treasuryKeyRefId: aliasRecord.keyRefId,
    treasuryPublicKey: publicKey,
  };
}

/**
 * Resolved account information
 */
export interface ResolvedAccount {
  accountId: string;
  accountKeyRefId: string;
  accountPublicKey: string;
}

/**
 * Parse and resolve account parameter
 * Can be:
 * - An alias (resolved via alias service)
 * - An account-id:account-key pair
 *
 * @param account - Account parameter from command
 * @param api - Core API instance
 * @param network - Current network
 * @returns Resolved account information
 */
export async function resolveAccountParameter(
  account: string | undefined,
  api: any,
  network: SupportedNetwork,
): Promise<ResolvedAccount | null> {
  if (!account) {
    return null;
  }

  // Check if it's an account-id:account-key pair
  if (account.includes(':')) {
    const parts = account.split(':');
    if (parts.length === 2) {
      const [accountId, accountKey] = parts;

      // Validate account ID format
      const accountIdPattern = /^0\.0\.\d+$/;
      if (!accountIdPattern.test(accountId)) {
        throw new Error(
          `Invalid account ID format: ${accountId}. Expected format: 0.0.123456`,
        );
      }

      // Import the account key
      const imported = api.credentialsState.importPrivateKey(accountKey);

      return {
        accountId,
        accountKeyRefId: imported.keyRefId,
        accountPublicKey: imported.publicKey,
      };
    } else {
      throw new Error(
        'Invalid account format. Expected either an alias or account-id:account-key',
      );
    }
  }

  // Try to resolve as an alias
  const aliasRecord = api.alias.resolve(account, 'account', network);
  if (!aliasRecord) {
    throw new Error(
      `Account alias "${account}" not found for network ${network}. ` +
        'Please provide either a valid alias or account-id:account-key pair.',
    );
  }

  // Get the account ID and key from the alias
  if (!aliasRecord.entityId) {
    throw new Error(
      `Account alias "${account}" does not have an associated account ID`,
    );
  }

  if (!aliasRecord.keyRefId) {
    throw new Error(
      `Account alias "${account}" does not have an associated key`,
    );
  }

  // Get the public key
  const publicKey = api.credentialsState.getPublicKey(aliasRecord.keyRefId);
  if (!publicKey) {
    throw new Error(
      `Account alias "${account}" key not found in credentials state`,
    );
  }

  return {
    accountId: aliasRecord.entityId,
    accountKeyRefId: aliasRecord.keyRefId,
    accountPublicKey: publicKey,
  };
}

/**
 * Resolved destination account information (no private key needed)
 */
export interface ResolvedDestinationAccount {
  accountId: string;
}

/**
 * Parse and resolve destination account parameter
 * Can be:
 * - An alias (resolved via alias service)
 * - An account-id (used directly)
 *
 * @param account - Account parameter from command
 * @param api - Core API instance
 * @param network - Current network
 * @returns Resolved destination account information
 */
export async function resolveDestinationAccountParameter(
  account: string | undefined,
  api: any,
  network: SupportedNetwork,
): Promise<ResolvedDestinationAccount | null> {
  if (!account) {
    return null;
  }

  // Check if it's already an account-id (format: 0.0.123456)
  const accountIdPattern = /^0\.0\.\d+$/;
  if (accountIdPattern.test(account)) {
    return {
      accountId: account,
    };
  }

  // Try to resolve as an alias
  const aliasRecord = api.alias.resolve(account, 'account', network);
  if (!aliasRecord) {
    throw new Error(
      `Account alias "${account}" not found for network ${network}. ` +
        'Please provide either a valid alias or account-id.',
    );
  }

  // Get the account ID from the alias
  if (!aliasRecord.entityId) {
    throw new Error(
      `Account alias "${account}" does not have an associated account ID`,
    );
  }

  return {
    accountId: aliasRecord.entityId,
  };
}
