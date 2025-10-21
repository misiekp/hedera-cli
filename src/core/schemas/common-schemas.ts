/**
 * Common JSON Schema Definitions
 *
 * This file contains reusable JSON Schema definitions for common Hedera data types
 * that are used across multiple plugin command outputs.
 *
 * Based on ADR-003: Result-Oriented Command Handler Contract
 */

/**
 * Hedera Entity ID pattern
 * Format: 0.0.12345
 * Example: 0.0.123456
 */
export const ENTITY_ID_SCHEMA = {
  type: 'string',
  pattern: '^0\\.0\\.[1-9][0-9]*$',
  description: 'Hedera entity ID in format 0.0.{number}',
  examples: ['0.0.12345', '0.0.123456'],
} as const;

/**
 * Hedera Timestamp pattern
 * Format: {seconds}.{nanoseconds}
 * Example: 1700000000.123456789
 */
export const TIMESTAMP_SCHEMA = {
  type: 'string',
  pattern: '^[0-9]+\\.[0-9]{9}$',
  description: 'Hedera timestamp in format {seconds}.{nanoseconds}',
  examples: ['1700000000.123456789', '1234567890.000000000'],
} as const;

/**
 * Hedera Transaction ID pattern
 * Format: {accountId}@{timestamp}
 * Example: 0.0.123@1700000000.123456789
 */
export const TRANSACTION_ID_SCHEMA = {
  type: 'string',
  pattern: '^0\\.0\\.[1-9][0-9]*@[0-9]+\\.[0-9]{9}$',
  description: 'Hedera transaction ID in format {accountId}@{timestamp}',
  examples: ['0.0.123@1700000000.123456789', '0.0.456789@1234567890.000000000'],
} as const;

/**
 * Token Balance with metadata
 * Includes base unit amount, token name, and decimals for proper display
 */
export const TOKEN_BALANCE_SCHEMA = {
  type: 'object',
  properties: {
    baseUnitAmount: {
      type: 'string',
      description:
        'Token balance in base units (smallest denomination, as integer string)',
      examples: ['105000', '1000000000'],
    },
    name: {
      type: 'string',
      description: 'Token name or symbol',
      examples: ['USDT', 'HBAR', 'MyToken'],
    },
    decimals: {
      type: 'integer',
      minimum: 0,
      maximum: 18,
      description: 'Number of decimal places for the token',
      examples: [4, 8, 18],
    },
  },
  required: ['baseUnitAmount', 'name', 'decimals'],
  description: 'Token balance with denomination information',
  examples: [
    {
      baseUnitAmount: '105000',
      name: 'USDT',
      decimals: 4,
    },
  ],
} as const;

/**
 * HBAR Balance (in tinybars)
 * Tinybars are the smallest unit of HBAR (1 HBAR = 100,000,000 tinybars)
 */
export const HBAR_BALANCE_SCHEMA = {
  type: 'string',
  pattern: '^[0-9]+$',
  description: 'HBAR balance in tinybars (1 HBAR = 100,000,000 tinybars)',
  examples: ['10000000', '100000000000'],
} as const;

/**
 * EVM Address (Ethereum-compatible address)
 * Format: 0x followed by 40 hexadecimal characters
 */
export const EVM_ADDRESS_SCHEMA = {
  type: 'string',
  pattern: '^0x[0-9a-fA-F]{40}$',
  description: 'EVM-compatible address',
  examples: ['0x1234567890123456789012345678901234567890'],
} as const;

/**
 * Public Key (ECDSA or ED25519)
 * Hexadecimal string representation
 */
export const PUBLIC_KEY_SCHEMA = {
  type: 'string',
  pattern: '^[0-9a-fA-F]+$',
  minLength: 64,
  maxLength: 132,
  description: 'Public key in hexadecimal format (ECDSA or ED25519)',
  examples: [
    '02a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
  ],
} as const;

/**
 * Network name
 * Supported Hedera network names
 */
export const NETWORK_SCHEMA = {
  type: 'string',
  enum: ['mainnet', 'testnet', 'previewnet', 'localnet'],
  description: 'Hedera network identifier',
} as const;

/**
 * Key Type
 * Supported key types in Hedera
 */
export const KEY_TYPE_SCHEMA = {
  type: 'string',
  enum: ['ECDSA', 'ED25519'],
  description: 'Cryptographic key type',
} as const;

/**
 * Token Supply Type
 */
export const SUPPLY_TYPE_SCHEMA = {
  type: 'string',
  enum: ['FINITE', 'INFINITE'],
  description: 'Token supply type',
} as const;

/**
 * ISO 8601 Timestamp
 * Standard date-time format
 */
export const ISO_TIMESTAMP_SCHEMA = {
  type: 'string',
  format: 'date-time',
  description: 'ISO 8601 timestamp',
  examples: ['2024-10-20T12:34:56.789Z'],
} as const;

/**
 * Account Data (Full)
 * Complete account information
 */
export const ACCOUNT_DATA_SCHEMA = {
  type: 'object',
  properties: {
    accountId: ENTITY_ID_SCHEMA,
    name: {
      type: 'string',
      description: 'Account name or alias',
    },
    type: KEY_TYPE_SCHEMA,
    network: NETWORK_SCHEMA,
    evmAddress: {
      ...EVM_ADDRESS_SCHEMA,
      nullable: true,
    },
    publicKey: {
      ...PUBLIC_KEY_SCHEMA,
      nullable: true,
    },
    balance: {
      ...HBAR_BALANCE_SCHEMA,
      nullable: true,
    },
  },
  required: ['accountId', 'name', 'network'],
} as const;

/**
 * Token Data (Full)
 * Complete token information
 */
export const TOKEN_DATA_SCHEMA = {
  type: 'object',
  properties: {
    tokenId: ENTITY_ID_SCHEMA,
    name: {
      type: 'string',
      description: 'Token name',
    },
    symbol: {
      type: 'string',
      description: 'Token symbol',
    },
    decimals: {
      type: 'integer',
      minimum: 0,
      maximum: 18,
      description: 'Token decimals',
    },
    initialSupply: {
      type: 'string',
      description: 'Initial supply in base units',
    },
    supplyType: SUPPLY_TYPE_SCHEMA,
    treasuryId: ENTITY_ID_SCHEMA,
    network: NETWORK_SCHEMA,
  },
  required: ['tokenId', 'name', 'symbol', 'decimals', 'network'],
} as const;

/**
 * Topic Data (Full)
 * Complete topic information
 */
export const TOPIC_DATA_SCHEMA = {
  type: 'object',
  properties: {
    topicId: ENTITY_ID_SCHEMA,
    name: {
      type: 'string',
      description: 'Topic name or alias',
    },
    memo: {
      type: 'string',
      description: 'Topic memo',
      nullable: true,
    },
    network: NETWORK_SCHEMA,
    createdAt: ISO_TIMESTAMP_SCHEMA,
  },
  required: ['topicId', 'network'],
} as const;

/**
 * Transaction Result (Common)
 * Standard transaction execution result
 */
export const TRANSACTION_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    transactionId: TRANSACTION_ID_SCHEMA,
    status: {
      type: 'string',
      description: 'Transaction status',
      examples: ['SUCCESS', 'PENDING'],
    },
    timestamp: TIMESTAMP_SCHEMA,
  },
  required: ['transactionId'],
} as const;

/**
 * Export all schemas as a single object for easy import
 */
export const COMMON_SCHEMAS = {
  entityId: ENTITY_ID_SCHEMA,
  timestamp: TIMESTAMP_SCHEMA,
  transactionId: TRANSACTION_ID_SCHEMA,
  tokenBalance: TOKEN_BALANCE_SCHEMA,
  hbarBalance: HBAR_BALANCE_SCHEMA,
  evmAddress: EVM_ADDRESS_SCHEMA,
  publicKey: PUBLIC_KEY_SCHEMA,
  network: NETWORK_SCHEMA,
  keyType: KEY_TYPE_SCHEMA,
  supplyType: SUPPLY_TYPE_SCHEMA,
  isoTimestamp: ISO_TIMESTAMP_SCHEMA,
  accountData: ACCOUNT_DATA_SCHEMA,
  tokenData: TOKEN_DATA_SCHEMA,
  topicData: TOPIC_DATA_SCHEMA,
  transactionResult: TRANSACTION_RESULT_SCHEMA,
} as const;

/**
 * Helper function to create a reference to a common schema
 * Useful for JSON Schema $ref references
 */
export function refCommonSchema(schemaName: keyof typeof COMMON_SCHEMAS): {
  $ref: string;
} {
  return { $ref: `#/definitions/${schemaName}` };
}
