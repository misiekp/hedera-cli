/**
 * Token Plugin Error Handling Tests
 * Tests error scenarios and edge cases across the token plugin
 */
import type { CommandHandlerArgs } from '../../../src/core/plugins/plugin.interface';
import { createTokenHandler } from '../../../src/plugins/token/commands/create';
import { associateTokenHandler } from '../../../src/plugins/token/commands/associate';
import { transferTokenHandler } from '../../../src/plugins/token/commands/transfer';
import { createTokenFromFileHandler } from '../../../src/plugins/token/commands/createFromFile';
import { ZustandTokenStateHelper } from '../../../src/plugins/token/zustand-state-helper';
import { Logger } from '../../../src/core/services/logger/logger-service.interface';
import type { CoreAPI } from '../../../src/core/core-api/core-api.interface';
import type { CredentialsService } from '../../../src/core/services/credentials/credentials-service.interface';
import type {
  SigningService,
  TransactionResult,
} from '../../../src/core/services/signing/signing-service.interface';
import type { TokenTransactionService } from '../../../src/core/services/tokens/token-transaction-service.interface';
import type { StateService } from '../../../src/core/services/state/state-service.interface';

let exitSpy: jest.SpyInstance;

jest.mock('../../../src/plugins/token/zustand-state-helper', () => ({
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
  createAssociationImpl,
  createTransferImpl,
  signAndExecuteImpl,
  getDefaultCredentialsImpl,
}: {
  createTokenImpl?: jest.Mock;
  createAssociationImpl?: jest.Mock;
  createTransferImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
  getDefaultCredentialsImpl?: jest.Mock;
}) => {
  const tokenTransactions: jest.Mocked<TokenTransactionService> = {
    createTokenTransaction: createTokenImpl || jest.fn(),
    createTokenAssociationTransaction: createAssociationImpl || jest.fn(),
    createTransferTransaction: createTransferImpl || jest.fn(),
  };

  const signing: jest.Mocked<SigningService> = {
    signAndExecute: jest.fn(),
    signAndExecuteWithKey: signAndExecuteImpl || jest.fn(),
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
    network: {} as any,
    config: {} as any,
    logger: {} as any,
  };

  return { api, tokenTransactions, signing, credentials, state };
};

describe('Token Plugin Error Handling', () => {
  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process.exit(${code})`);
    });
    MockedHelper.mockClear();
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  describe('network and connectivity errors', () => {
    test('should handle network timeout during token creation', async () => {
      // Arrange
      const { api, tokenTransactions, credentials } = makeApiMocks({
        createTokenImpl: jest
          .fn()
          .mockRejectedValue(new Error('Network timeout')),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.123456',
          privateKey: 'test-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-key',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create token: Error: Network timeout',
      );
    });

    test('should handle network connectivity issues during association', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        createAssociationImpl: jest
          .fn()
          .mockRejectedValue(new Error('Connection refused')),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
    });

    test('should handle network errors during transfer', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockRejectedValue(new Error('Network unreachable')),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          from: '0.0.345678',
          to: '0.0.789012',
          balance: 100,
          fromKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(transferTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
    });
  });

  describe('authentication and authorization errors', () => {
    test('should handle invalid credentials', async () => {
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

    test('should handle invalid private key', async () => {
      // Arrange
      const mockTokenTransaction = { test: 'transaction' };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        credentials,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue({
          success: false,
          transactionId: '',
          receipt: {
            status: {
              status: 'failed',
              transactionId: '',
              error: 'Invalid private key',
            },
          },
        }),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.123456',
          privateKey: 'invalid-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        "❌ Failed to create token: TypeError: Cannot read properties of undefined (reading 'success')",
      );
    });

    test('should handle insufficient permissions', async () => {
      // Arrange
      const mockAssociationTransaction = { test: 'association' };
      const _mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing,
      } = makeApiMocks({
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(mockAssociationTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(_mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.789012',
          accountKey: 'insufficient-permissions-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to associate token: Error: Token association failed',
      );
    });
  });

  describe('business logic errors', () => {
    test('should handle insufficient token balance', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer' };
      const _mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing,
      } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(_mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          from: '0.0.345678',
          to: '0.0.789012',
          balance: 1000000, // Large amount
          fromKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(transferTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Error: Token transfer failed',
      );
    });

    test('should handle token not found', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        createAssociationImpl: jest
          .fn()
          .mockRejectedValue(new Error('Token not found')),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.999999', // Non-existent token
          accountId: '0.0.789012',
          accountKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
    });

    test('should handle account not found', async () => {
      // Arrange
      const mockAssociationTransaction = { test: 'association' };
      const _mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing,
      } = makeApiMocks({
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(mockAssociationTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(_mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          accountId: '0.0.999999', // Non-existent account
          accountKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
    });

    test('should handle duplicate token name', async () => {
      // Arrange
      const mockTokenTransaction = { test: 'transaction' };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        credentials,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue({
          success: false,
          transactionId: '',
          receipt: { status: { status: 'failed', transactionId: '' } },
        }),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.123456',
          privateKey: 'test-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'ExistingToken', // Duplicate name
          symbol: 'TEST',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        "❌ Failed to create token: TypeError: Cannot read properties of undefined (reading 'success')",
      );
    });
  });

  describe('file system errors', () => {
    test('should handle file not found error', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'nonexistent-file',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenFromFileHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle file permission error', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'restricted-file',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenFromFileHandler(args)).rejects.toThrow();
    });

    test('should handle corrupted JSON file', async () => {
      // Arrange
      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'corrupted-file',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenFromFileHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('state management errors', () => {
    test('should handle state service failures', async () => {
      // Arrange
      const mockAddToken = jest.fn().mockImplementation(() => {
        throw new Error('State service unavailable');
      });

      MockedHelper.mockImplementation(() => ({
        addToken: mockAddToken,
      }));

      const mockTokenTransaction = { test: 'transaction' };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        credentials,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue({
          success: true,
          transactionId: '0.0.123@1234567890.123456789',
          tokenId: '0.0.123456',
          receipt: {
            status: {
              status: 'success',
              transactionId: '0.0.123@1234567890.123456789',
            },
          },
        }),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.123456',
          privateKey: 'test-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-key',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        "❌ Failed to create token: TypeError: Cannot read properties of undefined (reading 'success')",
      );
    });
  });

  describe('rate limiting and throttling', () => {
    test('should handle rate limiting errors', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        createTokenImpl: jest
          .fn()
          .mockRejectedValue(new Error('Rate limit exceeded')),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.123456',
          privateKey: 'test-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-key',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to create token: Error: Rate limit exceeded',
      );
    });

    test('should handle service throttling', async () => {
      // Arrange
      const mockTransferTransaction = { test: 'transfer' };
      const _mockSignResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing,
      } = makeApiMocks({
        createTransferImpl: jest
          .fn()
          .mockResolvedValue(mockTransferTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(_mockSignResult),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenId: '0.0.123456',
          from: '0.0.345678',
          to: '0.0.789012',
          balance: 100,
          fromKey: 'test-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(transferTokenHandler(args)).rejects.toThrow(
        'Process.exit(1)',
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to transfer token: Error: Token transfer failed',
      );
    });
  });

  describe('malformed data errors', () => {
    test('should handle malformed transaction responses', async () => {
      // Arrange
      const mockTokenTransaction = { test: 'transaction' };
      const _mockSignResult: TransactionResult = {
        success: true,
        transactionId: 'malformed-transaction-id',
        tokenId: '0.0.123456',
        receipt: {
          status: {
            status: 'success',
            transactionId: 'malformed-transaction-id',
          },
        },
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        credentials,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        signAndExecuteImpl: jest.fn().mockResolvedValue(_mockSignResult),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.123456',
          privateKey: 'test-key',
        }),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-key',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow('Process.exit(1)');
      expect(logger.error).toHaveBeenCalledWith(
        "❌ Failed to create token: TypeError: Cannot read properties of undefined (reading 'success')",
      );
    });

    test('should handle unexpected API responses', async () => {
      // Arrange
      const { api, tokenTransactions } = makeApiMocks({
        createTokenImpl: jest
          .fn()
          .mockResolvedValue('unexpected-response-type'),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          treasuryKey: 'test-key',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(createTokenHandler(args)).rejects.toThrow();
    });
  });

  describe('error recovery and resilience', () => {
    test('should handle partial failures gracefully', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockAddAssociation = jest.fn();
      const tokenId = '0.0.123456';

      MockedHelper.mockImplementation(() => ({
        addToken: mockAddToken,
        addAssociation: mockAddAssociation,
      }));

      const mockTokenTransaction = { test: 'token-transaction' };
      const mockAssociationTransaction = { test: 'association-transaction' };
      const _mockSignResult: TransactionResult = {
        success: true,
        transactionId: '0.0.123@1234567890.123456789',
        receipt: {} as any,
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        credentials,
      } = makeApiMocks({
        createTokenImpl: jest.fn().mockResolvedValue(mockTokenTransaction),
        createAssociationImpl: jest
          .fn()
          .mockResolvedValue(mockAssociationTransaction),
        signAndExecuteImpl: jest.fn().mockImplementation((transaction) => {
          if (transaction === mockTokenTransaction) {
            return Promise.resolve({
              success: true,
              transactionId: '0.0.123@1234567890.123456789',
              tokenId: '0.0.123456',
              receipt: {
                status: {
                  status: 'success',
                  transactionId: '0.0.123@1234567890.123456789',
                },
              },
            });
          }
          // Association fails
          return Promise.resolve({
            success: false,
            transactionId: '',
            receipt: { status: { status: 'failed', transactionId: '' } },
          });
        }),
        getDefaultCredentialsImpl: jest.fn().mockResolvedValue({
          accountId: '0.0.789012',
          privateKey: 'treasury-key',
        }),
      });

      const logger = makeLogger();

      // Act - Create token (success)
      const createArgs: CommandHandlerArgs = {
        args: {
          name: 'TestToken',
          symbol: 'TEST',
          adminKey: 'admin-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      await expect(createTokenHandler(createArgs)).rejects.toThrow(
        'Process.exit(1)',
      );

      // Act - Associate token (failure)
      const associateArgs: CommandHandlerArgs = {
        args: {
          tokenId,
          accountId: '0.0.345678',
          accountKey: 'user-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      await expect(associateTokenHandler(associateArgs)).rejects.toThrow(
        'Process.exit(1)',
      );

      // Assert - Both operations failed as expected
      expect(logger.error).toHaveBeenCalledWith(
        "❌ Failed to create token: TypeError: Cannot read properties of undefined (reading 'success')",
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to associate token: Error: Token association failed',
      );
    });
  });
});
