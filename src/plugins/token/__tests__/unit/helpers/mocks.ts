/**
 * Shared Mock Factory Functions for Token Plugin Tests
 * Provides reusable mocks for services, APIs, and common test utilities
 */
import type { Logger } from '../../../../../core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../../../core/core-api/core-api.interface';
import type { TokenService } from '../../../../../core/services/token/token-service.interface';
import type { TransactionService } from '../../../../../core/services/signing/signing-service.interface';
import type { StateService } from '../../../../../core/services/state/state-service.interface';
import type { KeyManagementService } from '../../../../../core/services/credentials-state/credentials-state-service.interface';
import type { AliasManagementService } from '../../../../../core/services/alias/alias-service.interface';
import type { AccountService } from '../../../../../core/services/account/account-transaction-service.interface';
import type { NetworkService } from '../../../../../core/services/network/network-service.interface';
import type { ConfigService } from '../../../../../core/services/config/config-service.interface';
import { mockTransactionResults } from './fixtures';

/**
 * Create a mocked Logger
 */
export const makeLogger = (): jest.Mocked<Logger> => ({
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
});

/**
 * Create a mocked TokenService
 */
export const makeTokenServiceMock = (
  overrides?: Partial<jest.Mocked<TokenService>>,
): jest.Mocked<TokenService> => ({
  createTokenTransaction: jest.fn(),
  createTokenAssociationTransaction: jest.fn(),
  createTransferTransaction: jest.fn(),
  createToken: jest.fn(),
  associateToken: jest.fn(),
  transfer: jest.fn(),
  ...overrides,
});

/**
 * @deprecated Use makeTokenServiceMock instead
 */
export const makeTokenTransactionServiceMock = makeTokenServiceMock;

/**
 * Create a mocked TransactionService (SigningService)
 */
export const makeSigningServiceMock = (
  overrides?: Partial<jest.Mocked<TransactionService>>,
): jest.Mocked<TransactionService> => ({
  signAndExecute: jest.fn().mockResolvedValue(mockTransactionResults.success),
  signAndExecuteWith: jest
    .fn()
    .mockResolvedValue(mockTransactionResults.success),
  ...overrides,
});

/**
 * Create a mocked KeyManagementService (CredentialsState)
 */
export const makeCredentialsStateMock = (
  overrides?: Partial<jest.Mocked<KeyManagementService>>,
): jest.Mocked<KeyManagementService> => ({
  createLocalPrivateKey: jest.fn(),
  importPrivateKey: jest.fn().mockReturnValue({
    keyRefId: 'mock-key-ref-id',
    publicKey: 'mock-public-key',
  }),
  getPublicKey: jest.fn().mockReturnValue('mock-public-key'),
  getSignerHandle: jest.fn(),
  findByPublicKey: jest.fn(),
  list: jest.fn().mockReturnValue([]),
  remove: jest.fn(),
  setDefaultOperator: jest.fn(),
  getDefaultOperator: jest.fn().mockReturnValue({
    accountId: '0.0.100000',
    keyRefId: 'operator-key-ref-id',
  }),
  ensureDefaultFromEnv: jest.fn().mockReturnValue({
    accountId: '0.0.100000',
    keyRefId: 'operator-key-ref-id',
  }),
  createClient: jest.fn(),
  signTransaction: jest.fn(),
  ...overrides,
});

/**
 * Create a mocked AliasManagementService
 */
export const makeAliasServiceMock = (
  overrides?: Partial<jest.Mocked<AliasManagementService>>,
): jest.Mocked<AliasManagementService> => ({
  register: jest.fn(),
  resolve: jest.fn().mockReturnValue(null),
  list: jest.fn().mockReturnValue([]),
  remove: jest.fn(),
  ...overrides,
});

/**
 * Create a mocked StateService
 */
export const makeStateServiceMock = (
  overrides?: Partial<jest.Mocked<StateService>>,
): jest.Mocked<StateService> => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
  clear: jest.fn(),
  has: jest.fn(),
  getNamespaces: jest.fn(),
  getKeys: jest.fn(),
  subscribe: jest.fn(),
  getActions: jest.fn(),
  getState: jest.fn(),
  ...overrides,
});

/**
 * Create a mocked AccountTransactionService
 */
export const makeAccountTransactionServiceMock =
  (): jest.Mocked<AccountService> =>
    ({
      createAccount: jest.fn(),
      getAccountInfo: jest.fn(),
      getAccountBalance: jest.fn(),
    }) as jest.Mocked<AccountService>;

/**
 * Configuration options for makeApiMocks
 */
interface ApiMocksConfig {
  tokens?: Partial<jest.Mocked<TokenService>>;
  tokenTransactions?: Partial<jest.Mocked<TokenService>>; // Deprecated, use 'tokens'
  signing?: Partial<jest.Mocked<TransactionService>>;
  credentialsState?: Partial<jest.Mocked<KeyManagementService>>;
  alias?: Partial<jest.Mocked<AliasManagementService>>;
  state?: Partial<jest.Mocked<StateService>>;
  network?: string;
  // Legacy support for old test patterns
  credentials?: Partial<jest.Mocked<KeyManagementService>>;
  createTransferImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
}

/**
 * Create a complete mocked CoreAPI with configurable services
 */
export const makeApiMocks = (config?: ApiMocksConfig) => {
  // Support both 'tokens' and 'tokenTransactions' for backward compatibility
  const tokens = makeTokenServiceMock(
    config?.tokens || config?.tokenTransactions,
  );
  const signing = makeSigningServiceMock(config?.signing);
  const credentialsState = makeCredentialsStateMock(
    config?.credentialsState || config?.credentials,
  );
  const alias = makeAliasServiceMock(config?.alias);
  const state = makeStateServiceMock(config?.state);
  const account = makeAccountTransactionServiceMock();

  const api: jest.Mocked<CoreAPI> = {
    account,
    token: tokens,
    topic: {} as unknown as any,
    signing,
    credentialsState,
    alias,
    state,
    mirror: {} as unknown as any,
    network: {
      getCurrentNetwork: jest
        .fn()
        .mockReturnValue(config?.network || 'testnet'),
    } as unknown as NetworkService,
    config: {} as unknown as ConfigService,
    logger: {
      log: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      warn: jest.fn(),
    } as jest.Mocked<Logger>,
  };

  return {
    api,
    tokens,
    tokenTransactions: tokens, // Deprecated alias for backward compatibility
    signing,
    credentialsState,
    credentials: credentialsState, // Legacy alias for backward compatibility
    alias,
    state,
    account,
    createTransferImpl: config?.createTransferImpl, // Legacy support
  };
};

/**
 * Setup and cleanup for process.exit spy
 */
export const mockProcessExit = () => {
  let exitSpy: jest.SpyInstance;

  const setupExit = () => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      // Return undefined as never to satisfy TypeScript
      // Tests will verify process.exit was called with the correct code
      return undefined as never;
    });
  };

  const cleanupExit = () => {
    if (exitSpy) {
      exitSpy.mockRestore();
    }
  };

  const getExitSpy = () => exitSpy;

  return { setupExit, cleanupExit, getExitSpy };
};

/**
 * Create a custom transaction result
 */
export const makeTransactionResult = (
  overrides?: Partial<{
    success: boolean;
    transactionId: string;
    tokenId?: string;
    accountId?: string;
  }>,
) => ({
  success: overrides?.success ?? true,
  transactionId: overrides?.transactionId ?? '0.0.123@1234567890.123456789',
  tokenId: overrides?.tokenId,
  accountId: overrides?.accountId,
  receipt: {
    status: {
      status: (overrides?.success ?? true) ? 'success' : 'failed',
      transactionId: overrides?.transactionId ?? '0.0.123@1234567890.123456789',
    },
  },
});

/**
 * Setup and cleanup for process.exit spy that throws
 * Use this variant for tests that expect process.exit to throw an error
 */
export const mockProcessExitThrows = () => {
  let exitSpy: jest.SpyInstance;

  const setupExit = () => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process.exit(${code})`);
    });
  };

  const cleanupExit = () => {
    if (exitSpy) {
      exitSpy.mockRestore();
    }
  };

  const getExitSpy = () => exitSpy;

  return { setupExit, cleanupExit, getExitSpy };
};

/**
 * Mock ZustandTokenStateHelper
 * Provides a mocked implementation of the token state helper
 */
export const mockZustandTokenStateHelper = (
  ZustandTokenStateHelperClass: any,
  overrides?: Partial<{
    saveToken: jest.Mock;
    addToken: jest.Mock;
    addAssociation: jest.Mock;
    getToken: jest.Mock;
    getAllTokens: jest.Mock;
    removeToken: jest.Mock;
    addTokenAssociation: jest.Mock;
  }>,
) => {
  ZustandTokenStateHelperClass.mockClear();
  ZustandTokenStateHelperClass.mockImplementation(() => ({
    saveToken: jest.fn().mockResolvedValue(undefined),
    addToken: jest.fn(),
    addAssociation: jest.fn(),
    getToken: jest.fn(),
    getAllTokens: jest.fn(),
    removeToken: jest.fn(),
    addTokenAssociation: jest.fn(),
    ...overrides,
  }));
  return ZustandTokenStateHelperClass;
};

/**
 * Create mocks for file system operations (fs/promises and path)
 * Used primarily for file-based token creation tests
 */
export const makeFsMocks = () => {
  const mockReadFile = jest.fn();
  const mockAccess = jest.fn();
  const mockJoin = jest.fn();
  const mockResolve = jest.fn();

  const setupFsMocks = (
    fs: any,
    path: any,
    config?: {
      fileContent?: string;
      fileExists?: boolean;
      joinPath?: string;
      resolvePath?: string;
    },
  ) => {
    fs.readFile = mockReadFile;
    fs.access = mockAccess;
    path.join = mockJoin;
    path.resolve = mockResolve;

    if (config?.fileContent !== undefined) {
      mockReadFile.mockResolvedValue(config.fileContent);
    }
    if (config?.fileExists !== undefined) {
      mockAccess.mockResolvedValue(
        config.fileExists
          ? undefined
          : Promise.reject(new Error('File not found')),
      );
    }
    if (config?.joinPath) {
      mockJoin.mockReturnValue(config.joinPath);
    }
    if (config?.resolvePath) {
      mockResolve.mockReturnValue(config.resolvePath);
    }
  };

  const cleanupFsMocks = () => {
    mockReadFile.mockClear();
    mockAccess.mockClear();
    mockJoin.mockClear();
    mockResolve.mockClear();
  };

  return {
    mockReadFile,
    mockAccess,
    mockJoin,
    mockResolve,
    setupFsMocks,
    cleanupFsMocks,
  };
};

/**
 * Setup mock implementation for ZustandTokenStateHelper for list tests
 * Simplifies the repetitive mock setup across list test cases
 */
export const setupZustandHelperMock = (
  MockedHelperClass: jest.Mock,
  config: {
    tokens?: any[];
    stats?: {
      total: number;
      byNetwork: Record<string, number>;
      bySupplyType: Record<string, number>;
      withAssociations: number;
      totalAssociations: number;
    };
  },
) => {
  MockedHelperClass.mockImplementation(() => ({
    listTokens: jest.fn().mockReturnValue(config.tokens || []),
    getTokenStats: jest.fn().mockReturnValue(
      config.stats || {
        total: 0,
        byNetwork: {},
        bySupplyType: {},
        withAssociations: 0,
        totalAssociations: 0,
      },
    ),
  }));
};
