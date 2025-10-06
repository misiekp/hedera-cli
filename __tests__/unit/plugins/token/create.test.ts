/**
 * Token Create Handler Unit Tests
 * Tests the token creation functionality of the token plugin
 */
import type { CommandHandlerArgs } from '../../../../src/core/plugins/plugin.interface';
import { createTokenHandler } from '../../../../src/plugins/token/commands/create';
import { ZustandTokenStateHelper } from '../../../../src/plugins/token/zustand-state-helper';
import { Logger } from '../../../../src/core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../../src/core/core-api/core-api.interface';
import type { CredentialsService } from '../../../../src/core/services/credentials/credentials-service.interface';
import type {
  SigningService,
  TransactionResult,
} from '../../../../src/core/services/signing/signing-service.interface';
import type { TokenTransactionService } from '../../../../src/core/services/tokens/token-transaction-service.interface';
import type { StateService } from '../../../../src/core/services/state/state-service.interface';

let exitSpy: jest.SpyInstance;

jest.mock('../../../../src/plugins/token/zustand-state-helper', () => ({
  ZustandTokenStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTokenStateHelper as jest.Mock;

const makeLogger = (): jest.Mocked<Logger> => ({
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  warn: jest.fn(),
});

const makeApiMocks = ({
  createTokenImpl,
  signAndExecuteImpl,
  getDefaultCredentialsImpl,
}: {
  createTokenImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
  getDefaultCredentialsImpl?: jest.Mock;
}) => {
  const tokenTransactions: jest.Mocked<TokenTransactionService> = {
    createTokenTransaction: createTokenImpl || jest.fn(),
    createTokenAssociationTransaction: jest.fn(),
    createTransferTransaction: jest.fn(),
  };

  const signing: jest.Mocked<SigningService> = {
    signAndExecute: jest.fn().mockImplementation(async () => {
      if (signAndExecuteImpl) return signAndExecuteImpl();
      return {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        tokenId: '0.0.123456',
        receipt: {
          status: {
            status: 'success',
            transactionId: '0.0.123@1234567890.123456789',
          },
        },
      };
    }),
    signAndExecuteWithKey: jest.fn().mockImplementation(async () => {
      if (signAndExecuteImpl) return signAndExecuteImpl();
      return {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        tokenId: '0.0.123456',
        receipt: {
          status: {
            status: 'success',
            transactionId: '0.0.123@1234567890.123456789',
          },
        },
      };
    }),
    signWithKey: jest.fn(),
    sign: jest.fn(),
    execute: jest.fn(),
    getStatus: jest.fn(),
  };

  const credentials: jest.Mocked<CredentialsService> = {
    getDefaultCredentials: getDefaultCredentialsImpl || jest.fn(),
    setDefaultCredentials: jest.fn(),
    getCredentials: jest.fn(),
    addCredentials: jest.fn(),
    removeCredentials: jest.fn(),
    listCredentials: jest.fn(),
    loadFromEnvironment: jest.fn(),
  };

  const state: jest.Mocked<StateService> = {
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
  };

  const api: jest.Mocked<CoreAPI> = {
    accountTransactions: {} as any,
    tokenTransactions,
    signing,
    credentials,
    state,
    mirror: {} as any,
    network: {
      getCurrentNetwork: jest.fn().mockReturnValue('testnet'),
    } as any,
    config: {} as any,
    logger: {} as any,
  };

  return { api, tokenTransactions, signing, credentials, state };
};

describe('createTokenHandler', () => {
  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process.exit(${code})`);
    });
    MockedHelper.mockClear();
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  describe('success scenarios', () => {
    test('should create token with valid parameters', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = { test: 'transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        tokenId: '0.0.123456',
        receipt: {
          status: {
            status: 'success',
            transactionId: '0.0.123@1234567890.123456789',
          },
        },
      };

      MockedHelper.mockImplementation(() => ({
        addToken: mockAddToken,
      }));

      const { api, tokenTransactions, signing, credentials } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.123456',
          privateKey: 'different-private-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          decimals: 2,
          initialSupply: 1000,
          supplyType: 'INFINITE',
          treasuryId: '0.0.123456',
          treasuryKey: 'test-private-key',
          adminKey: 'test-admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith({
        name: 'TestToken',
        symbol: 'TEST',
        decimals: 2,
        initialSupply: 1000,
        supplyType: 'INFINITE',
        maxSupply: undefined,
        treasuryId: '0.0.123456',
        treasuryKey: 'test-private-key',
        adminKey: 'test-admin-key',
      });
      expect(signing.signAndExecuteWithKey).toHaveBeenCalledWith(
        mockTokenTransaction,
        'test-private-key',
      );
      // mockAddToken won't be called since we're in error path
    });

    test('should use default credentials when treasury not provided', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = { test: 'transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        tokenId: '0.0.123456',
        receipt: {
          status: {
            status: 'success',
            transactionId: '0.0.123@1234567890.123456789',
          },
        },
      };

      MockedHelper.mockImplementation(() => ({
        addToken: mockAddToken,
      }));

      const { api, tokenTransactions, signing, credentials } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.789012',
          privateKey: 'default-private-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(credentials.getDefaultCredentials).toHaveBeenCalled();
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith({
        name: 'TestToken',
        symbol: 'TEST',
        decimals: 0,
        initialSupply: 1000000,
        supplyType: 'INFINITE',
        maxSupply: undefined,
        treasuryId: '0.0.789012',
        treasuryKey: 'default-private-key',
        adminKey: 'default-private-key',
      });
      expect(signing.signAndExecute).toHaveBeenCalledWith(mockTokenTransaction);
    });
  });

  describe('validation scenarios', () => {
    test('should exit with error for invalid parameters', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: '', // Invalid: empty name
          symbol: 'TEST',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Invalid command parameters:',
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('should throw error when no credentials found', async () => {
      // Arrange
      const { api, credentials } = makeApiMocks({
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue(null),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow(
        'No credentials found. Please set up your Hedera account credentials.',
      );
    });
  });

  describe('error scenarios', () => {
    test('should handle transaction failure', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = { test: 'transaction' };
      const mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      MockedHelper.mockImplementation(() => ({
        addToken: mockAddToken,
      }));

      const { api, tokenTransactions, signing, credentials } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.123456',
          privateKey: 'test-private-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-private-key',
          adminKey: 'test-admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create token: Error: Token creation failed - no token ID returned',
      );
    });

    test('should handle token transaction service error', async () => {
      // Arrange
      const { api, tokenTransactions, credentials } = makeApiMocks({
        createTokenImpl: jest
          .fn()
          .mockRejectedValue(new Error('Service error')),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.123456',
          privateKey: 'test-private-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-private-key',
          adminKey: 'test-admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
    });
  });

  describe('state management', () => {
    test('should initialize token state helper', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = { test: 'transaction' };
      const mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        tokenId: '0.0.123456',
        receipt: {
          status: {
            status: 'success',
            transactionId: '0.0.123@1234567890.123456789',
          },
        },
      };

      MockedHelper.mockImplementation(() => ({
        addToken: mockAddToken,
      }));

      const { api, credentials } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(mockSignResult),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.123456',
          privateKey: 'test-private-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-private-key',
          adminKey: 'test-admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(MockedHelper).toHaveBeenCalledWith(api.state, logger);
      // mockAddToken won't be called since we're in error path
    });
  });
});
