/**
 * Token Plugin Error Handling Tests
 * Tests error scenarios and edge cases across the token plugin
 */
import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { createTokenHandler } from '../../commands/create';
import { associateTokenHandler } from '../../commands/associate';
import { transferTokenHandler } from '../../commands/transfer';
import { createTokenFromFileHandler } from '../../commands/createFromFile';
import { ZustandTokenStateHelper } from '../../zustand-state-helper';
import type { TransactionResult } from '../../../../core/services/tx-execution/tx-execution-service.interface';
import {
  makeLogger,
  makeApiMocks,
  mockProcessExitThrows,
  mockZustandTokenStateHelper,
} from './helpers/mocks';

jest.mock('../../zustand-state-helper', () => ({
  ZustandTokenStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTokenStateHelper as jest.Mock;
const { setupExit, cleanupExit, getExitSpy } = mockProcessExitThrows();

/**
 * Helper to create alias mock that resolves test key strings
 */
const makeTestAliasService = () => ({
  resolve: jest.fn().mockImplementation((alias, type) => {
    // Mock key alias resolution for test keys
    if (type === 'key' && alias === 'admin-key') {
      return {
        keyRefId: 'admin-key-ref-id',
        publicKey: 'admin-key',
      };
    }
    return null;
  }),
});

describe('Token Plugin Error Handling', () => {
  beforeEach(() => {
    setupExit();
    mockZustandTokenStateHelper(MockedHelper);
  });

  afterEach(() => {
    cleanupExit();
  });

  describe('network and connectivity errors', () => {
    test('should handle network timeout during token creation', async () => {
      // Arrange
      const { api, tokenTransactions: _tokenTransactions } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest.fn().mockImplementation(() => {
            throw new Error('Network timeout');
          }),
        },
        kms: {
          getPublicKey: jest.fn().mockReturnValue('test-public-key'),
        },
        alias: makeTestAliasService(),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenName: 'TestToken',
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
        '❌ Failed to create token: Network timeout',
      );
    });

    test('should handle network connectivity issues during association', async () => {
      // Arrange
      const { api, tokenTransactions: _tokenTransactions } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockImplementation(() => {
              throw new Error('Connection refused');
            }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          account: '0.0.789012:test-key',
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
        '❌ Failed to associate token: Connection refused',
      );
    });

    test('should handle network errors during transfer', async () => {
      // Arrange
      const {
        api,
        tokenTransactions: _tokenTransactions,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest.fn().mockImplementation(() => {
            throw new Error('Network unreachable');
          }),
        },
        mirror: {
          getTokenInfo: jest.fn().mockResolvedValue({ decimals: 6 }),
        },
        kms: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          from: '0.0.345678:test-key',
          to: '0.0.789012',
          balance: 100,
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
        '❌ Failed to transfer token: Network unreachable',
      );
    });
  });

  describe('authentication and authorization errors', () => {
    test('should handle invalid credentials', async () => {
      // Arrange
      const { api, kms: _kms } = makeApiMocks();

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenName: 'TestToken',
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
        expect.stringContaining('❌ Failed to create token:'),
      );
    });

    test('should handle invalid private key', async () => {
      // Arrange
      const mockTokenTransaction = { test: 'transaction' };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTokenTransaction),
        },
        signing: {
          signAndExecute: jest.fn().mockResolvedValue({
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
          signAndExecuteWith: jest.fn().mockResolvedValue({
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
        },
        kms: {
          getPublicKey: jest.fn().mockReturnValue('invalid-public-key'),
        },
        alias: makeTestAliasService(),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenName: 'TestToken',
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
        '❌ Failed to create token: Token creation failed - no token ID returned',
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
        signing: _signing,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(_mockSignResult),
        },
        kms: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'imported-key-ref-id',
            publicKey: 'imported-public-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          account: '0.0.789012:insufficient-permissions-key',
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
        '❌ Failed to associate token: Token association failed',
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
        signing: _signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest
            .fn()
            .mockResolvedValue(mockTransferTransaction),
        },
        mirror: {
          getTokenInfo: jest.fn().mockResolvedValue({ decimals: 6 }),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(_mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          from: '0.0.345678:test-key',
          to: '0.0.789012',
          balance: 1000000, // Large amount
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
        '❌ Failed to transfer token: Token transfer failed',
      );
    });

    test('should handle token not found', async () => {
      // Arrange
      const { api, tokenTransactions: _tokenTransactions } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockImplementation(() => {
              throw new Error('Token not found');
            }),
        },
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
        signing: _signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(_mockSignResult),
        },
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
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTokenTransaction),
        },
        signing: {
          signAndExecute: jest.fn().mockResolvedValue({
            success: false,
            transactionId: '',
            receipt: { status: { status: 'failed', transactionId: '' } },
          }),
          signAndExecuteWith: jest.fn().mockResolvedValue({
            success: false,
            transactionId: '',
            receipt: { status: { status: 'failed', transactionId: '' } },
          }),
        },
        kms: {
          getPublicKey: jest.fn().mockReturnValue('test-public-key'),
        },
        alias: makeTestAliasService(),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenName: 'ExistingToken', // Duplicate name
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
        '❌ Failed to create token: Token creation failed - no token ID returned',
      );
    });
  });

  describe('file system errors', () => {
    test('should handle file not found error', async () => {
      // Arrange
      const { api } = makeApiMocks();
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
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });

    test('should handle file permission error', async () => {
      // Arrange
      const { api } = makeApiMocks();
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
      const { api } = makeApiMocks();
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
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });
  });

  describe('state management errors', () => {
    test('should handle state service failures', async () => {
      // Arrange
      const mockSaveToken = jest.fn().mockImplementation(() => {
        throw new Error('State service unavailable');
      });

      mockZustandTokenStateHelper(MockedHelper, {
        saveToken: mockSaveToken,
      });

      const mockTokenTransaction = { test: 'transaction' };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTokenTransaction),
        },
        signing: {
          signAndExecute: jest.fn().mockResolvedValue({
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
          signAndExecuteWith: jest.fn().mockResolvedValue({
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
        },
        kms: {
          getPublicKey: jest.fn().mockReturnValue('test-public-key'),
        },
        alias: makeTestAliasService(),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenName: 'TestToken',
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
        '❌ Failed to create token: State service unavailable',
      );
    });
  });

  describe('rate limiting and throttling', () => {
    test('should handle rate limiting errors', async () => {
      // Arrange
      const {
        api,
        tokenTransactions: _tokenTransactions,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest.fn().mockImplementation(() => {
            throw new Error('Rate limit exceeded');
          }),
        },
        kms: {
          getPublicKey: jest.fn().mockReturnValue('test-public-key'),
        },
        alias: makeTestAliasService(),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenName: 'TestToken',
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
        '❌ Failed to create token: Rate limit exceeded',
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
        signing: _signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTransferTransaction: jest
            .fn()
            .mockResolvedValue(mockTransferTransaction),
        },
        mirror: {
          getTokenInfo: jest.fn().mockResolvedValue({ decimals: 6 }),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(_mockSignResult),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          from: '0.0.345678:test-key',
          to: '0.0.789012',
          balance: 100,
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
        '❌ Failed to transfer token: Token transfer failed',
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
        // tokenId is missing - this is the malformed response
        receipt: {
          status: {
            status: 'success',
            transactionId: 'malformed-transaction-id',
          },
        },
      } as any;

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
        kms: _kms,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue(mockTokenTransaction),
        },
        signing: {
          signAndExecute: jest.fn().mockResolvedValue(_mockSignResult),
          signAndExecuteWith: jest.fn().mockResolvedValue(_mockSignResult),
        },
        kms: {
          getPublicKey: jest.fn().mockReturnValue('test-public-key'),
        },
        alias: makeTestAliasService(),
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenName: 'TestToken',
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
        '❌ Failed to create token: Token creation failed - no token ID returned',
      );
    });

    test('should handle unexpected API responses', async () => {
      // Arrange
      const { api, tokenTransactions: _tokenTransactions } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockResolvedValue('unexpected-response-type'),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          tokenName: 'TestToken',
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
    test('should handle failures and log appropriate errors', async () => {
      // Arrange
      const mockAssociationTransaction = { test: 'association-transaction' };
      const mockFailureResult: TransactionResult = {
        success: false,
        transactionId: '',
        receipt: { status: { status: 'failed', transactionId: '' } },
      };

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenAssociationTransaction: jest
            .fn()
            .mockResolvedValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockFailureResult),
        },
      });

      const logger = makeLogger();

      // Act - Associate token (should fail)
      const associateArgs: CommandHandlerArgs = {
        args: {
          token: '0.0.123456',
          account: '0.0.345678:user-key',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await expect(associateTokenHandler(associateArgs)).rejects.toThrow(
        'Process.exit(1)',
      );

      // Assert - Should log appropriate error
      expect(logger.error).toHaveBeenCalledWith(
        '❌ Failed to associate token: Token association failed',
      );
    });
  });
});
