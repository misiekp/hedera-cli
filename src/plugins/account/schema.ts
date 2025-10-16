/**
 * Account Plugin State Schema
 * Single source of truth for account data structure and validation
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Zod schema for runtime validation
export const AccountDataSchema = z.object({
  keyRefId: z.string().min(1, 'Key reference ID is required'),

  name: z
    .string()
    .max(50, 'Alias must be 50 characters or less')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Name can only contain letters, numbers, underscores, and hyphens',
    ),

  accountId: z
    .string()
    .regex(/^0\.0\.[0-9]+$/, 'Account ID must be in format 0.0.123456'),

  type: z.enum(['ECDSA', 'ED25519'], {
    errorMap: () => ({ message: 'Type must be either ECDSA or ED25519' }),
  }),

  publicKey: z.string().min(1, 'Public key is required'),

  evmAddress: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      'EVM address must be 40 hex characters starting with 0x',
    ),

  solidityAddress: z.string().min(1, 'Solidity address is required'),

  solidityAddressFull: z.string().min(1, 'Solidity address full is required'),

  network: z.enum(['mainnet', 'testnet', 'previewnet'], {
    errorMap: () => ({
      message: 'Network must be mainnet, testnet, or previewnet',
    }),
  }),
});

// TypeScript type inferred from Zod schema
export type AccountData = z.infer<typeof AccountDataSchema>;

// Namespace constant
export const ACCOUNT_NAMESPACE = 'account-accounts';

// JSON Schema for manifest (automatically generated from Zod schema)
export const ACCOUNT_JSON_SCHEMA = zodToJsonSchema(AccountDataSchema);

/**
 * Validate account data using Zod schema
 */
export function validateAccountData(data: unknown): data is AccountData {
  try {
    AccountDataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse and validate account data with detailed error messages
 */
export function parseAccountData(data: unknown): AccountData {
  return AccountDataSchema.parse(data);
}

/**
 * Safe parse account data (returns success/error instead of throwing)
 */
export function safeParseAccountData(data: unknown) {
  return AccountDataSchema.safeParse(data);
}
