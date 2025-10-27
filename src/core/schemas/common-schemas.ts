/**
 * Common Zod Schema Definitions
 *
 * This file contains reusable Zod schemas for common Hedera data types
 * that are used across multiple plugin command outputs.
 *
 * Based on ADR-003: Result-Oriented Command Handler Contract
 */
import { z } from 'zod';

/**
 * Hedera Entity ID pattern
 * Format: 0.0.12345
 * Example: 0.0.123456
 */
export const EntityIdSchema = z
  .string()
  .regex(
    /^0\.0\.[1-9][0-9]*$/,
    'Hedera entity ID must be in format 0.0.{number}',
  )
  .describe('Hedera entity ID in format 0.0.{number}');

/**
 * Hedera Timestamp pattern
 * Format: {seconds}.{nanoseconds}
 * Example: 1700000000.123456789
 */
export const TimestampSchema = z
  .string()
  .regex(
    /^[0-9]+\.[0-9]{9}$/,
    'Hedera timestamp must be in format {seconds}.{nanoseconds}',
  )
  .describe('Hedera timestamp in format {seconds}.{nanoseconds}');

/**
 * Hedera Transaction ID pattern
 * Format: {accountId}@{timestamp}
 * Example: 0.0.123@1700000000.123456789
 */
export const TransactionIdSchema = z
  .string()
  .regex(
    /^0\.0\.[1-9][0-9]*@[0-9]+\.[0-9]{9}$/,
    'Hedera transaction ID must be in format {accountId}@{timestamp}',
  )
  .describe('Hedera transaction ID in format {accountId}@{timestamp}');

/**
 * Token Balance Amount Schema
 * Accepts both BigInt and string inputs, validates int64 range
 */
export const TokenAmountSchema = z
  .union([
    z.bigint(),
    z
      .string()
      .regex(/^\d+$/)
      .transform((v) => BigInt(v)),
  ])
  .refine((v) => v >= 0n && v <= int64Max, {
    message: 'Token amount out of range for int64',
  })
  .describe('Token amount in base units');

/**
 * Token Balance with metadata
 * Includes base unit amount, token name, and decimals for proper display
 */
export const TokenBalanceSchema = z
  .object({
    baseUnitAmount: TokenAmountSchema,
    name: z.string().describe('Token name or symbol'),
    decimals: z
      .number()
      .int()
      .min(0)
      .max(18)
      .describe('Number of decimal places for the token'),
  })
  .describe('Token balance with denomination information');

/**
 * Maximum value for int64 (2^63 - 1)
 */
export const int64Max = 9223372036854775807n;

/**
 * Tinybar Balance
 * Tinybars are the smallest unit of HBAR (1 HBAR = 100,000,000 tinybars)
 * Accepts both BigInt and string inputs, validates int64 range
 */
export const TinybarBalanceSchema = z
  .union([
    z.bigint(),
    z
      .string()
      .regex(/^\d+$/)
      .transform((v) => BigInt(v)),
  ])
  .refine((v) => v >= 0n && v <= int64Max, {
    message: 'Tinybar value out of range for int64',
  })
  .describe('Tinybar balance (1 HBAR = 100,000,000 tinybars)');

/**
 * EVM Address (Ethereum-compatible address)
 * Format: 0x followed by 40 hexadecimal characters
 */
export const EvmAddressSchema = z
  .string()
  .regex(
    /^0x[0-9a-fA-F]{40}$/,
    'EVM address must be 0x followed by 40 hexadecimal characters',
  )
  .describe('EVM-compatible address');

/**
 * Public Key (ECDSA or ED25519)
 * Hexadecimal string representation
 */
export const PublicKeySchema = z
  .string()
  .regex(/^[0-9a-fA-F]+$/, 'Public key must be a hexadecimal string')
  .min(64, 'Public key must be at least 64 characters')
  .max(132, 'Public key must be at most 132 characters')
  .describe('Public key in hexadecimal format (ECDSA or ED25519)');

/**
 * Network name
 * Supported Hedera network names
 */
export const NetworkSchema = z
  .enum(['mainnet', 'testnet', 'previewnet', 'localnet'])
  .describe('Hedera network identifier');

/**
 * Key Type
 * Supported key types in Hedera
 */
export const KeyTypeSchema = z
  .enum(['ECDSA', 'ED25519'])
  .describe('Cryptographic key type');

/**
 * Token Supply Type
 */
export const SupplyTypeSchema = z
  .enum(['FINITE', 'INFINITE'])
  .describe('Token supply type');

/**
 * ISO 8601 Timestamp
 * Standard date-time format
 */
export const IsoTimestampSchema = z
  .string()
  .datetime()
  .describe('ISO 8601 timestamp');

/**
 * Account Data (Full)
 * Complete account information
 */
export const AccountDataSchema = z
  .object({
    accountId: EntityIdSchema,
    name: z.string().describe('Account name or alias'),
    type: KeyTypeSchema,
    network: NetworkSchema,
    evmAddress: EvmAddressSchema.nullable(),
    publicKey: PublicKeySchema.nullable(),
    balance: TinybarBalanceSchema.nullable(),
  })
  .describe('Complete account information');

/**
 * Token Data (Full)
 * Complete token information
 */
export const TokenDataSchema = z
  .object({
    tokenId: EntityIdSchema,
    name: z.string().describe('Token name'),
    symbol: z.string().describe('Token symbol'),
    decimals: z.number().int().min(0).max(18).describe('Token decimals'),
    initialSupply: z.string().describe('Initial supply in base units'),
    supplyType: SupplyTypeSchema,
    treasuryId: EntityIdSchema,
    network: NetworkSchema,
  })
  .describe('Complete token information');

/**
 * Topic Data (Full)
 * Complete topic information
 */
export const TopicDataSchema = z
  .object({
    topicId: EntityIdSchema,
    name: z.string().describe('Topic name or alias'),
    memo: z.string().describe('Topic memo').nullable(),
    network: NetworkSchema,
    createdAt: IsoTimestampSchema,
  })
  .describe('Complete topic information');

/**
 * Transaction Result (Common)
 * Standard transaction execution result
 */
export const TransactionResultSchema = z
  .object({
    transactionId: TransactionIdSchema,
    status: z.string().describe('Transaction status'),
    timestamp: TimestampSchema,
  })
  .describe('Standard transaction execution result');

/**
 * Export all Zod schemas as a single object for easy import
 */
export const COMMON_ZOD_SCHEMAS = {
  entityId: EntityIdSchema,
  timestamp: TimestampSchema,
  transactionId: TransactionIdSchema,
  tokenAmount: TokenAmountSchema,
  tokenBalance: TokenBalanceSchema,
  tinybarBalance: TinybarBalanceSchema,
  evmAddress: EvmAddressSchema,
  publicKey: PublicKeySchema,
  network: NetworkSchema,
  keyType: KeyTypeSchema,
  supplyType: SupplyTypeSchema,
  isoTimestamp: IsoTimestampSchema,
  accountData: AccountDataSchema,
  tokenData: TokenDataSchema,
  topicData: TopicDataSchema,
  transactionResult: TransactionResultSchema,
} as const;

/**
 * Type exports for TypeScript inference
 */
export type EntityId = z.infer<typeof EntityIdSchema>;
export type Timestamp = z.infer<typeof TimestampSchema>;
export type TransactionId = z.infer<typeof TransactionIdSchema>;
export type TokenAmount = z.infer<typeof TokenAmountSchema>;
export type TokenBalance = z.infer<typeof TokenBalanceSchema>;
export type TinybarBalance = z.infer<typeof TinybarBalanceSchema>;
export type EvmAddress = z.infer<typeof EvmAddressSchema>;
export type PublicKey = z.infer<typeof PublicKeySchema>;
export type Network = z.infer<typeof NetworkSchema>;
export type KeyType = z.infer<typeof KeyTypeSchema>;
export type SupplyType = z.infer<typeof SupplyTypeSchema>;
export type IsoTimestamp = z.infer<typeof IsoTimestampSchema>;
export type AccountData = z.infer<typeof AccountDataSchema>;
export type TokenData = z.infer<typeof TokenDataSchema>;
export type TopicData = z.infer<typeof TopicDataSchema>;
export type TransactionResult = z.infer<typeof TransactionResultSchema>;
