/**
 * Test Fixtures for Account Plugin Tests
 * Reusable test data and constants
 */
import type { AccountData } from '../../../schema';

/**
 * Mock Account IDs
 */
export const mockAccountIds = {
  default: '0.0.1234',
  testAccount: '0.0.1001',
  account2: '0.0.2002',
  account3: '0.0.5005',
  account4: '0.0.6006',
};

/**
 * Mock Account Data
 */
export const mockAccountData = {
  default: {
    name: 'default',
    accountId: mockAccountIds.default,
    type: 'ECDSA' as const,
    publicKey: 'pk',
    evmAddress: '0x0000000000000000000000000000000000000000',
    solidityAddress: 'sa',
    solidityAddressFull: 'safull',
    privateKey: 'priv',
    network: 'testnet',
  } satisfies AccountData,
  testAccount: {
    name: 'test-account',
    accountId: mockAccountIds.testAccount,
    type: 'ECDSA' as const,
    publicKey: 'pk',
    evmAddress: '0x0000000000000000000000000000000000000000',
    solidityAddress: 'sa',
    solidityAddressFull: 'safull',
    privateKey: 'priv',
    network: 'testnet',
  } satisfies AccountData,
  ed25519Account: {
    name: 'acc3',
    accountId: mockAccountIds.account3,
    type: 'ED25519' as const,
    publicKey: 'pk',
    evmAddress: '0x0000000000000000000000000000000000000000',
    solidityAddress: 'sa',
    solidityAddressFull: 'safull',
    privateKey: 'priv',
    network: 'testnet',
  } satisfies AccountData,
};

/**
 * Mock Token Balances
 */
export const mockTokenBalances = {
  empty: [],
  twoTokens: [
    { token_id: '0.0.3003', balance: 100 },
    { token_id: '0.0.4004', balance: 200 },
  ],
};

/**
 * Mock Transaction Results
 */
export const mockTransactionResults = {
  success: {
    transactionId: 'tx-123',
    success: true,
    accountId: '0.0.9999',
    receipt: {} as any,
  },
  failure: {
    transactionId: 'tx-456',
    success: false,
    receipt: {} as any,
  },
};

/**
 * Mock Account Creation Responses
 */
export const mockAccountCreationData = {
  default: {
    transaction: {},
    privateKey: 'priv-key',
    publicKey: 'pub-key',
    evmAddress: '0x000000000000000000000000000000000000abcd',
  },
};

/**
 * Mock Mirror Node Account Responses
 */
export const mockMirrorAccountData = {
  default: {
    accountId: '0.0.1234',
    accountPublicKey: 'pubKey',
    evmAddress: '0xabc',
    balance: { balance: 1000n, timestamp: '1234567890' },
  },
  withBalance: {
    accountPublicKey: 'pubKey',
    evmAddress: '0xabc',
    balance: { balance: 100n },
  },
};

/**
 * Mock Account Lists
 */
export const mockAccountLists = {
  empty: [],
  twoAccounts: [
    { ...mockAccountData.default, name: 'acc1', accountId: '0.0.1111' },
    { ...mockAccountData.default, name: 'acc2', accountId: '0.0.2222' },
  ],
};
