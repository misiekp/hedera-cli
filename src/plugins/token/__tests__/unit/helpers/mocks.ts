/**
 * Shared Mock Factory Functions for Token Plugin Tests
 * Provides reusable mocks for services, APIs, and common test utilities
 */
import type { Logger } from '../../../../../core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../../../core/core-api/core-api.interface';
import type { TokenTransactionService } from '../../../../../core/services/tokens/token-transaction-service.interface';
import type { SigningService } from '../../../../../core/services/signing/signing-service.interface';
import type { StateService } from '../../../../../core/services/state/state-service.interface';
import type { CredentialsService } from '../../../../../core/services/credentials/credentials-service.interface';
import type { AccountTransactionService } from '../../../../../core/services/accounts/account-transaction-service.interface';
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
 * Create a mocked TokenTransactionService
 */
export const makeTokenTransactionServiceMock = (
  overrides?: Partial<jest.Mocked<TokenTransactionService>>,
): jest.Mocked<TokenTransactionService> => ({
  createTokenTransaction: jest.fn(),
  createTokenAssociationTransaction: jest.fn(),
  createTransferTransaction: jest.fn(),
  ...overrides,
});

/**
 * Create a mocked SigningService
 */
export const makeSigningServiceMock = (
  overrides?: Partial<jest.Mocked<SigningService>>,
): jest.Mocked<SigningService> => ({
  signAndExecute: jest.fn().mockResolvedValue(mockTransactionResults.success),
  signAndExecuteWithKey: jest
    .fn()
    .mockResolvedValue(mockTransactionResults.success),
  signWithKey: jest.fn(),
  sign: jest.fn(),
  execute: jest.fn(),
  getStatus: jest.fn(),
  ...overrides,
});

/**
 * Create a mocked CredentialsService
 */
export const makeCredentialsServiceMock = (
  overrides?: Partial<jest.Mocked<CredentialsService>>,
): jest.Mocked<CredentialsService> => ({
  getDefaultCredentials: jest.fn(),
  setDefaultCredentials: jest.fn(),
  getCredentials: jest.fn(),
  addCredentials: jest.fn(),
  removeCredentials: jest.fn(),
  listCredentials: jest.fn(),
  loadFromEnvironment: jest.fn(),
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
  (): jest.Mocked<AccountTransactionService> =>
    ({
      createAccount: jest.fn(),
      getAccountInfo: jest.fn(),
      getAccountBalance: jest.fn(),
    }) as jest.Mocked<AccountTransactionService>;

/**
 * Configuration options for makeApiMocks
 */
interface ApiMocksConfig {
  tokenTransactions?: Partial<jest.Mocked<TokenTransactionService>>;
  signing?: Partial<jest.Mocked<SigningService>>;
  credentials?: Partial<jest.Mocked<CredentialsService>>;
  state?: Partial<jest.Mocked<StateService>>;
  network?: string;
}

/**
 * Create a complete mocked CoreAPI with configurable services
 */
export const makeApiMocks = (config?: ApiMocksConfig) => {
  const tokenTransactions = makeTokenTransactionServiceMock(
    config?.tokenTransactions,
  );
  const signing = makeSigningServiceMock(config?.signing);
  const credentials = makeCredentialsServiceMock(config?.credentials);
  const state = makeStateServiceMock(config?.state);
  const accountTransactions = makeAccountTransactionServiceMock();

  const api: jest.Mocked<CoreAPI> = {
    accountTransactions,
    tokenTransactions,
    signing,
    credentials,
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
    tokenTransactions,
    signing,
    credentials,
    state,
    accountTransactions,
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
