/**
 * Token Plugin State Schema
 * Single source of truth for token data structure and validation
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

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

  alias: z.string().min(1, 'Alias must be at least 1 character').optional(),
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

// TokenId or alias
const tokenIdOrAlias = z.string().min(1, 'Token ID or alias is required');

// Command parameter validation schema for associate command
export const TokenAssociateCommandSchema = z.object({
  token: tokenIdOrAlias,

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
  token: tokenIdOrAlias,

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
