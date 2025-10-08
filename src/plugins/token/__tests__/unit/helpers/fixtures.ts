/**
 * Test Fixtures for Token Plugin Tests
 * Reusable test data and constants
 */

/**
 * Mock Account IDs
 */
export const mockAccountIds = {
  treasury: '0.0.123456',
  operator: '0.0.100000',
  association: '0.0.789012',
  collector: '0.0.999999',
  receiver: '0.0.555555',
};

/**
 * Mock Keys (private keys for testing)
 */
export const mockKeys = {
  treasury: 'treasury-key',
  admin: 'admin-key',
  supply: 'supply-key',
  wipe: 'wipe-key',
  kyc: 'kyc-key',
  freeze: 'freeze-key',
  pause: 'pause-key',
  feeSchedule: 'fee-schedule-key',
  association: 'association-key',
  operator: 'operator-private-key',
};

/**
 * Mock Credentials
 */
export const mockCredentials = {
  testnet: {
    accountId: mockAccountIds.operator,
    privateKey: mockKeys.operator,
    network: 'testnet' as const,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  mainnet: {
    accountId: mockAccountIds.operator,
    privateKey: mockKeys.operator,
    network: 'mainnet' as const,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
};

/**
 * Valid Token File Data
 */
export const validTokenFile = {
  name: 'TestToken',
  symbol: 'TEST',
  decimals: 2,
  supplyType: 'finite' as const,
  initialSupply: 1000,
  maxSupply: 10000,
  treasury: {
    accountId: mockAccountIds.treasury,
    key: mockKeys.treasury,
  },
  keys: {
    adminKey: mockKeys.admin,
    supplyKey: mockKeys.supply,
    wipeKey: mockKeys.wipe,
    kycKey: mockKeys.kyc,
    freezeKey: mockKeys.freeze,
    pauseKey: mockKeys.pause,
    feeScheduleKey: mockKeys.feeSchedule,
  },
  associations: [
    {
      accountId: mockAccountIds.association,
      key: mockKeys.association,
    },
  ],
  customFees: [
    {
      type: 'fixed' as const,
      amount: 10,
      unitType: 'HBAR' as const,
      collectorId: mockAccountIds.collector,
    },
  ],
  memo: 'Test token created from file',
};

/**
 * Valid Token Creation Parameters
 */
export const validTokenParams = {
  name: 'TestToken',
  symbol: 'TEST',
  decimals: 2,
  initialSupply: 1000,
  supplyType: 'FINITE' as const,
  maxSupply: 10000,
  treasuryId: mockAccountIds.treasury,
  adminKey: mockKeys.admin,
  treasuryKey: mockKeys.treasury,
};

/**
 * Infinite Supply Token File
 */
export const infiniteSupplyTokenFile = {
  ...validTokenFile,
  supplyType: 'infinite' as const,
  maxSupply: 0,
};

/**
 * Invalid Token File - Missing Name
 */
export const invalidTokenFileMissingName = {
  symbol: 'TEST',
  decimals: 2,
  supplyType: 'finite' as const,
  initialSupply: 1000,
  treasury: {
    accountId: mockAccountIds.treasury,
    key: mockKeys.treasury,
  },
  keys: {
    adminKey: mockKeys.admin,
  },
};

/**
 * Invalid Token File - Invalid Account ID
 */
export const invalidTokenFileInvalidAccountId = {
  ...validTokenFile,
  treasury: {
    accountId: 'invalid-account-id',
    key: mockKeys.treasury,
  },
};

/**
 * Invalid Token File - Invalid Supply Type
 */
export const invalidTokenFileInvalidSupplyType = {
  ...validTokenFile,
  supplyType: 'invalid-type',
};

/**
 * Invalid Token File - Negative Initial Supply
 */
export const invalidTokenFileNegativeSupply = {
  ...validTokenFile,
  initialSupply: -100,
};

/**
 * Mock Transaction Results
 */
export const mockTransactionResults = {
  success: {
    success: true,
    transactionId: '0.0.123@1234567890.123456789',
    tokenId: '0.0.123456',
    receipt: {
      status: {
        status: 'success',
        transactionId: '0.0.123@1234567890.123456789',
      },
    },
  },
  successWithAssociation: {
    success: true,
    transactionId: '0.0.123@1234567890.123456790',
    receipt: {
      status: {
        status: 'success',
        transactionId: '0.0.123@1234567890.123456790',
      },
    },
  },
  failure: {
    success: false,
    transactionId: '',
    receipt: {
      status: {
        status: 'failed',
        transactionId: '',
      },
    },
  },
};

/**
 * Mock Token Data (stored in state)
 */
export const mockTokenData = {
  basic: {
    tokenId: '0.0.123456',
    name: 'TestToken',
    symbol: 'TEST',
    decimals: 2,
    totalSupply: 1000,
    treasury: mockAccountIds.treasury,
    adminKey: mockKeys.admin,
    supplyKey: mockKeys.supply,
    network: 'testnet' as const,
    customFees: [],
  },
  withFees: {
    tokenId: '0.0.123456',
    name: 'TestToken',
    symbol: 'TEST',
    decimals: 2,
    totalSupply: 1000,
    treasury: mockAccountIds.treasury,
    adminKey: mockKeys.admin,
    supplyKey: mockKeys.supply,
    network: 'testnet' as const,
    customFees: [
      {
        feeCollectorAccountId: mockAccountIds.collector,
        hbarAmount: { _valueInTinybar: 10 },
      },
    ],
  },
};

/**
 * Mock File Paths
 */
export const mockFilePaths = {
  valid: '/path/to/token.test.json',
  resolved: '/resolved/path/to/token.test.json',
  nonexistent: '/path/to/nonexistent.json',
};

/**
 * Mock Transaction Objects
 */
export const mockTransactions = {
  token: { test: 'token-transaction' },
  association: { test: 'association-transaction' },
  transfer: { test: 'transfer-transaction' },
};

/**
 * Schema Test Data - Valid Token Data
 */
export const validTokenDataForSchema = {
  tokenId: '0.0.123456',
  name: 'TestToken',
  symbol: 'TEST',
  decimals: 2,
  initialSupply: 1000,
  supplyType: 'FINITE' as const,
  maxSupply: 10000,
  treasuryId: '0.0.789012',
  associations: [
    {
      name: 'TestAccount',
      accountId: '0.0.345678',
    },
  ],
  keys: {
    adminKey: 'admin-key',
    supplyKey: 'supply-key',
    wipeKey: 'wipe-key',
    kycKey: 'kyc-key',
    freezeKey: 'freeze-key',
    pauseKey: 'pause-key',
    feeScheduleKey: 'fee-schedule-key',
    treasuryKey: 'treasury-key',
  },
  network: 'testnet' as const,
  customFees: [
    {
      type: 'fixed' as const,
      amount: 10,
      unitType: 'HBAR' as const,
      collectorId: '0.0.999999',
    },
  ],
};

/**
 * Schema Test Data - Valid Token Keys
 */
export const validTokenKeys = {
  adminKey: 'admin-key',
  supplyKey: 'supply-key',
  wipeKey: 'wipe-key',
  kycKey: 'kyc-key',
  freezeKey: 'freeze-key',
  pauseKey: 'pause-key',
  feeScheduleKey: 'fee-schedule-key',
  treasuryKey: 'treasury-key',
};

/**
 * Schema Test Data - Valid Token Association
 */
export const validTokenAssociation = {
  name: 'TestAccount',
  accountId: '0.0.345678',
};

/**
 * Schema Test Data - Valid Custom Fee
 */
export const validCustomFee = {
  type: 'fixed' as const,
  amount: 10,
  unitType: 'HBAR' as const,
  collectorId: '0.0.999999',
  exempt: false,
};

/**
 * Schema Test Data - Valid Token Create Parameters
 */
export const validTokenCreateParams = {
  name: 'TestToken',
  symbol: 'TEST',
  decimals: 2,
  initialSupply: 1000,
  supplyType: 'INFINITE' as const,
  treasuryId: '0.0.123456',
  adminKey: 'admin-key',
};

/**
 * Schema Test Data - Minimal Valid Create Parameters
 */
export const minimalTokenCreateParams = {
  name: 'TestToken',
  symbol: 'TEST',
};

/**
 * Plugin Manifest Expectations
 */
export const expectedPluginManifest = {
  name: 'token',
  version: '1.0.0',
  displayName: 'Token Plugin',
  expectedCommands: ['create', 'associate', 'transfer', 'create-from-file'],
  expectedCapabilities: [
    'state:namespace:token-tokens',
    'network:read',
    'network:write',
    'signing:use',
  ],
};

/**
 * State Management Test Data - Mock Token Data
 */
export const mockStateTokenData = {
  basic: {
    tokenId: '0.0.123456',
    name: 'TestToken',
    symbol: 'TEST',
    decimals: 2,
    initialSupply: 1000,
    supplyType: 'FINITE' as const,
    maxSupply: 10000,
    treasuryId: '0.0.789012',
    keys: {
      adminKey: 'admin-key',
      supplyKey: '',
      wipeKey: '',
      kycKey: '',
      freezeKey: '',
      pauseKey: '',
      feeScheduleKey: '',
      treasuryKey: 'treasury-key',
    },
    network: 'testnet' as const,
    associations: [],
    customFees: [],
  },
  withAssociations: {
    tokenId: '0.0.123456',
    name: 'TestToken',
    symbol: 'TEST',
    decimals: 2,
    initialSupply: 1000,
    supplyType: 'FINITE' as const,
    maxSupply: 10000,
    treasuryId: '0.0.789012',
    keys: {
      adminKey: 'admin-key',
      supplyKey: '',
      wipeKey: '',
      kycKey: '',
      freezeKey: '',
      pauseKey: '',
      feeScheduleKey: '',
      treasuryKey: 'treasury-key',
    },
    network: 'testnet' as const,
    associations: [{ name: 'TestAccount', accountId: '0.0.111111' }],
    customFees: [],
  },
};
